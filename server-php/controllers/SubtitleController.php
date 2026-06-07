<?php
namespace Controllers;

use Config\Database;
use Middleware\AuthMiddleware;

class SubtitleController {
    public static function uploadSubtitle() {
        $mediaId = $_POST['mediaId'] ?? '';
        $mediaType = $_POST['mediaType'] ?? '';
        $language = $_POST['language'] ?? '';
        $version = $_POST['version'] ?? '1.0';
        $releaseNotes = $_POST['releaseNotes'] ?? '';
        $seasonNumber = isset($_POST['seasonNumber']) ? (int)$_POST['seasonNumber'] : null;
        $episodeNumber = isset($_POST['episodeNumber']) ? (int)$_POST['episodeNumber'] : null;
        $seasonStatus = ($_POST['seasonStatus'] ?? 'Ongoing') === 'Complete' ? 'Complete' : 'Ongoing';

        if (!isset($_FILES['subtitle'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Subtitle file is required']);
            return;
        }

        $file = $_FILES['subtitle'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['message' => 'Error uploading file']);
            return;
        }

        if (empty($mediaId) || empty($mediaType) || empty($language)) {
            http_response_code(400);
            echo json_encode(['message' => 'Media ID, Media Type (Movie/Drama/Episode), and Language are required']);
            return;
        }

        if (!in_array($language, ['Sinhala', 'English'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Only Sinhala and English subtitles are supported']);
            return;
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['srt', 'vtt', 'ass'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid subtitle format. Supported formats: SRT, VTT, ASS']);
            return;
        }

        // Save locally
        $folder = 'subtitles';
        $targetDir = dirname(__DIR__) . '/uploads/' . $folder;
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $fileName = 'subtitle-' . time() . '-' . rand(1000, 9999) . '.' . $ext;
        $destination = $targetDir . '/' . $fileName;

        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $fileUrl = "/uploads/{$folder}/{$fileName}";
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to save subtitle file']);
            return;
        }

        $db = Database::getInstance();
        $user = AuthMiddleware::$currentUser;
        $admin = AuthMiddleware::$currentAdmin;

        if ($admin) {
            $uploaderId = $admin['_id'];
            $uploaderRole = 'Admin';
            $approvalStatus = 'Approved';
        } else if ($user) {
            $uploaderId = $user['_id'];
            $uploaderRole = 'User';
            $approvalStatus = 'Pending';
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Please sign in before uploading subtitles']);
            return;
        }

        $subtitle = [
            'mediaId' => $mediaId,
            'mediaType' => $mediaType,
            'language' => $language,
            'version' => $version,
            'uploader' => $uploaderRole === 'User' ? $uploaderId : null,
            'adminUploader' => $uploaderRole === 'Admin' ? $uploaderId : null,
            'uploaderRole' => $uploaderRole,
            'seasonNumber' => $seasonNumber,
            'episodeNumber' => $episodeNumber,
            'seasonStatus' => $seasonStatus,
            'fileUrl' => $fileUrl,
            'format' => $ext,
            'downloads' => 0,
            'rating' => 0,
            'ratings' => [],
            'approvalStatus' => $approvalStatus,
            'releaseNotes' => $releaseNotes
        ];

        $inserted = $db->insertOne('subtitles', $subtitle);

        if ($uploaderRole === 'User') {
            // Add notification for admins
            $db->insertOne('notifications', [
                'recipientType' => 'Admin',
                'title' => 'New Subtitle Pending Approval',
                'message' => "User {$user['username']} uploaded a new {$language} subtitle for {$mediaType} ID: {$mediaId}",
                'type' => 'system',
                'isRead' => false
            ]);
        }

        http_response_code(201);
        echo json_encode([
            'message' => $uploaderRole === 'Admin'
                ? 'Admin subtitle uploaded and published successfully.'
                : 'Subtitle uploaded successfully. Pending moderator approval.',
            'subtitle' => $inserted
        ]);
    }

    public static function getSubtitlesForMedia($mediaId) {
        $db = Database::getInstance();
        $subtitles = $db->find('subtitles', [
            'mediaId' => $mediaId,
            'approvalStatus' => 'Approved'
        ], ['sort' => ['downloads' => -1, 'rating' => -1]]);

        // Populate uploader
        foreach ($subtitles as &$sub) {
            $uploader = $db->findOne('users', ['_id' => $sub['uploader']]);
            $sub['uploader'] = $uploader ? [
                '_id' => $uploader['_id'],
                'username' => $uploader['username'],
                'avatar' => $uploader['avatar'] ?? ''
            ] : null;
        }

        header('Content-Type: application/json');
        echo json_encode($subtitles);
    }

    public static function getRecentApprovedSubtitles() {
        $limit = (int)($_GET['limit'] ?? 4);
        if ($limit > 20) $limit = 20;

        $db = Database::getInstance();
        $subtitles = $db->find('subtitles', [
            'approvalStatus' => 'Approved'
        ], [
            'sort' => ['createdAt' => -1],
            'limit' => $limit
        ]);

        // Populate uploader
        foreach ($subtitles as &$sub) {
            $uploader = $db->findOne('users', ['_id' => $sub['uploader']]);
            $sub['uploader'] = $uploader ? [
                '_id' => $uploader['_id'],
                'username' => $uploader['username'],
                'avatar' => $uploader['avatar'] ?? ''
            ] : null;
        }

        header('Content-Type: application/json');
        echo json_encode($subtitles);
    }

    public static function trackDownload($id) {
        $db = Database::getInstance();
        $subtitle = $db->findOne('subtitles', ['_id' => $id]);
        if (!$subtitle) {
            http_response_code(404);
            echo json_encode(['message' => 'Subtitle not found']);
            return;
        }

        $downloads = ($subtitle['downloads'] ?? 0) + 1;
        $db->updateOne('subtitles', ['_id' => $id], ['downloads' => $downloads]);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Download tracked', 'downloads' => $downloads]);
    }

    public static function rateSubtitle($id) {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $score = (int)($body['score'] ?? 0);

        if ($score < 1 || $score > 5) {
            http_response_code(400);
            echo json_encode(['message' => 'Score must be between 1 and 5']);
            return;
        }

        $db = Database::getInstance();
        $subtitle = $db->findOne('subtitles', ['_id' => $id]);
        if (!$subtitle) {
            http_response_code(404);
            echo json_encode(['message' => 'Subtitle not found']);
            return;
        }

        $user = AuthMiddleware::$currentUser;
        $ratings = $subtitle['ratings'] ?? [];
        $existingIndex = -1;
        foreach ($ratings as $idx => $r) {
            if ((string)$r['userId'] === (string)$user['_id']) {
                $existingIndex = $idx;
                break;
            }
        }

        if ($existingIndex > -1) {
            $ratings[$existingIndex]['score'] = $score;
        } else {
            $ratings[] = ['userId' => $user['_id'], 'score' => $score];
        }

        // Recalculate average rating
        $sum = 0;
        foreach ($ratings as $r) {
            $sum += $r['score'];
        }
        $avg = count($ratings) > 0 ? round($sum / count($ratings), 1) : 0;

        $db->updateOne('subtitles', ['_id' => $id], [
            'ratings' => $ratings,
            'rating' => $avg
        ]);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Subtitle rated successfully', 'rating' => $avg]);
    }

    public static function getModerationQueue() {
        $db = Database::getInstance();
        $subtitles = $db->find('subtitles', [], ['sort' => ['createdAt' => -1]]);

        // Populate uploader
        foreach ($subtitles as &$sub) {
            $uploader = $db->findOne('users', ['_id' => $sub['uploader']]);
            $sub['uploader'] = $uploader ? [
                '_id' => $uploader['_id'],
                'username' => $uploader['username'],
                'email' => $uploader['email'] ?? ''
            ] : null;
        }

        header('Content-Type: application/json');
        echo json_encode($subtitles);
    }

    public static function updateApprovalStatus($id) {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $status = $body['status'] ?? '';
        $moderatorNotes = $body['moderatorNotes'] ?? '';

        if (!in_array($status, ['Approved', 'Rejected'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Status must be Approved or Rejected']);
            return;
        }

        $db = Database::getInstance();
        $subtitle = $db->findOne('subtitles', ['_id' => $id]);
        if (!$subtitle) {
            http_response_code(404);
            echo json_encode(['message' => 'Subtitle not found']);
            return;
        }

        $db->updateOne('subtitles', ['_id' => $id], [
            'approvalStatus' => $status,
            'moderatorNotes' => $moderatorNotes
        ]);

        // Notify uploader
        $db->insertOne('notifications', [
            'recipient' => $subtitle['uploader'],
            'title' => "Subtitle Upload {$status}",
            'message' => "Your subtitle upload for {$subtitle['language']} was " . strtolower($status) . "." . ($moderatorNotes ? ' Notes: ' . $moderatorNotes : ''),
            'type' => $status === 'Approved' ? 'subtitle_approved' : 'subtitle_rejected',
            'isRead' => false
        ]);

        $subtitle['approvalStatus'] = $status;
        $subtitle['moderatorNotes'] = $moderatorNotes;

        header('Content-Type: application/json');
        echo json_encode(['message' => "Subtitle " . strtolower($status) . " successfully", 'subtitle' => $subtitle]);
    }

    public static function getUploaderHistory($userId) {
        $db = Database::getInstance();
        $uploads = $db->find('subtitles', ['uploader' => $userId], ['sort' => ['createdAt' => -1]]);

        $totalDownloads = 0;
        foreach ($uploads as $up) {
            $totalDownloads += $up['downloads'] ?? 0;
        }

        header('Content-Type: application/json');
        echo json_encode([
            'uploads' => $uploads,
            'totalUploads' => count($uploads),
            'totalDownloads' => $totalDownloads
        ]);
    }

    public static function editSubtitle($id) {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $db = Database::getInstance();
        $subtitle = $db->findOne('subtitles', ['_id' => $id]);
        if (!$subtitle) {
            http_response_code(404);
            echo json_encode(['message' => 'Subtitle not found']);
            return;
        }

        $updates = [];
        if (isset($body['language'])) $updates['language'] = $body['language'];
        if (isset($body['version'])) $updates['version'] = $body['version'];
        if (isset($body['seasonNumber'])) $updates['seasonNumber'] = $body['seasonNumber'] === '' ? null : (int)$body['seasonNumber'];
        if (isset($body['episodeNumber'])) $updates['episodeNumber'] = $body['episodeNumber'] === '' ? null : (int)$body['episodeNumber'];
        if (isset($body['seasonStatus'])) $updates['seasonStatus'] = $body['seasonStatus'];
        if (isset($body['approvalStatus'])) $updates['approvalStatus'] = $body['approvalStatus'];
        if (isset($body['releaseNotes'])) $updates['releaseNotes'] = $body['releaseNotes'];
        if (isset($body['moderatorNotes'])) $updates['moderatorNotes'] = $body['moderatorNotes'];

        if (!empty($updates)) {
            $db->updateOne('subtitles', ['_id' => $id], $updates);
            $subtitle = $db->findOne('subtitles', ['_id' => $id]);
        }

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Subtitle updated successfully', 'subtitle' => $subtitle]);
    }

    public static function deleteSubtitle($id) {
        $db = Database::getInstance();
        $subtitle = $db->findOne('subtitles', ['_id' => $id]);
        if (!$subtitle) {
            http_response_code(404);
            echo json_encode(['message' => 'Subtitle not found']);
            return;
        }

        if (!empty($subtitle['fileUrl']) && strpos($subtitle['fileUrl'], '/uploads/') === 0) {
            $filePath = dirname(dirname(__DIR__)) . $subtitle['fileUrl'];
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }

        $db->deleteOne('subtitles', ['_id' => $id]);
        header('Content-Type: application/json');
        echo json_encode(['message' => 'Subtitle deleted successfully']);
    }
}
