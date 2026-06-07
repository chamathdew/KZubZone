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
}
