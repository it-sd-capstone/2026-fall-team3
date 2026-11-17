
-- ShelfSpace v0.1.0 Database Schema
-- Shared media library

CREATE TABLE IF NOT EXISTS media_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS media_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    creator VARCHAR(150) NOT NULL,
    release_year SMALLINT UNSIGNED NOT NULL,
    progress_status ENUM(
        'Planned',
        'In Progress',
        'Completed',
        'On Hold'
    ) NOT NULL DEFAULT 'Planned',
    platform VARCHAR(80),
    rating TINYINT UNSIGNED,
    notes TEXT,
    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_media_items_type
        FOREIGN KEY (type_id)
        REFERENCES media_types(id),

    CONSTRAINT chk_media_rating
        CHECK (rating IS NULL OR rating BETWEEN 1 AND 10),

    INDEX idx_media_title (title),
    INDEX idx_media_type (type_id),
    INDEX idx_media_status (progress_status),
    INDEX idx_media_release_year (release_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
