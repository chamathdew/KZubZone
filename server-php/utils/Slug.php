<?php
namespace Utils;

class Slug {
    public static function slugify($value = '') {
        $slug = (string)$value;
        $slug = strtolower(trim($slug));
        $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug);
        $slug = preg_replace('/^-+|-+$/', '', $slug);
        return $slug ?: 'untitled';
    }

    public static function cleanSlug($value = '') {
        return preg_replace('/-\d+$/', '', (string)$value);
    }

    public static function normalizePermalinkSlug($value = '') {
        $slug = trim((string)$value);
        if ($slug === '') {
            return '';
        }

        $slug = rawurldecode($slug);
        $slug = preg_split('/[?#]/', $slug)[0];
        $slug = trim($slug, '/');

        if (preg_match_all('#(?:^|/)(?:movie|drama)/([^/?#]+)#i', $slug, $matches) && !empty($matches[1])) {
            $slug = end($matches[1]);
        } elseif (preg_match('#https?://#i', $slug)) {
            $parts = preg_split('#https?://[^/]+/(?:movie|drama)/#i', $slug, -1, PREG_SPLIT_NO_EMPTY);
            if (!empty($parts)) {
                $slug = end($parts);
            }
        }

        return self::slugify($slug);
    }

    public static function createUniqueSlug($checkCallback, $title, $existingId = null) {
        $baseSlug = self::slugify($title);
        $candidate = $baseSlug;
        $suffix = 2;

        while (true) {
            $existing = call_user_func($checkCallback, $candidate);
            if (!$existing || ($existingId && (string)$existing['_id'] === (string)$existingId)) {
                return $candidate;
            }
            $candidate = $baseSlug . '-' . $suffix;
            $suffix++;
        }
    }

    public static function findByPermalinkSlug($db, $collection, $slug) {
        $slug = self::normalizePermalinkSlug($slug);

        $doc = $db->findOne($collection, ['slug' => $slug]);
        if ($doc) {
            return $doc;
        }

        $clean = self::cleanSlug($slug);
        if ($clean !== $slug) {
            $doc = $db->findOne($collection, ['slug' => $clean]);
            if ($doc) {
                return $doc;
            }
        }

        return $db->findOne($collection, [
            'slug' => ['$regex' => '^' . preg_quote($clean, '/') . '-[0-9]+$']
        ], ['sort' => ['createdAt' => 1]]);
    }
}
