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
        $slug = self::slugify($slug);

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
