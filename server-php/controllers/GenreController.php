<?php
namespace Controllers;

use Config\Database;

class GenreController {
    public static function getAllGenres() {
        $db = Database::getInstance();
        $genres = $db->find('genres', [], ['sort' => ['name' => 1]]);

        header('Content-Type: application/json');
        echo json_encode($genres);
    }
}
