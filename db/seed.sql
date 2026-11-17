
-- ShelfSpace v0.1.0
-- Sample media for testing the shared library.
-- Run db/schema.sql before this file.

-- Create five media categories if needed.
INSERT IGNORE INTO media_types (name)
VALUES
    ('Games'),
    ('Movies'),
    ('TV Shows'),
    ('Books'),
    ('Music Albums');

-- Insert 20 sample media items.
-- Existing items with the same title and category
-- will not be duplicated when this script is rerun.

INSERT INTO media_items (
    type_id,
    title,
    creator,
    release_year,
    progress_status,
    platform,
    rating,
    notes
)
SELECT
    t.id,
    s.title,
    s.creator,
    s.release_year,
    s.progress_status,
    s.platform,
    s.rating,
    s.notes
FROM (
    -- Games
    SELECT 'Games' category,
           'Helldivers 2' title,
           'Arrowhead Game Studios' creator,
           2024 release_year,
           'In Progress' progress_status,
           'PC' platform,
           9 rating,
           'Cooperative action game' notes

    UNION ALL SELECT
        'Games', 'No Man''s Sky', 'Hello Games',
        2016, 'Completed', 'PC', 9,
        'Space exploration game'

    UNION ALL SELECT
        'Games', 'Rainbow Six Siege', 'Ubisoft Montreal',
        2015, 'In Progress', 'PC', 8,
        'Tactical multiplayer shooter'

    UNION ALL SELECT
        'Games', 'Minecraft', 'Mojang Studios',
        2011, 'Planned', 'PC', NULL,
        'Sandbox building game'

    -- Movies
    UNION ALL SELECT
        'Movies', 'Shrek', 'DreamWorks Animation',
        2001, 'Completed', NULL, 10,
        'Animated fantasy comedy'

    UNION ALL SELECT
        'Movies', 'Moana', 'Walt Disney Animation Studios',
        2016, 'Completed', NULL, 9,
        'Animated musical adventure'

    UNION ALL SELECT
        'Movies', 'The Wild Robot', 'DreamWorks Animation',
        2024, 'Completed', NULL, 9,
        'Animated science fiction adventure'

    UNION ALL SELECT
        'Movies', 'The Super Mario Bros. Movie', 'Illumination',
        2023, 'Planned', NULL, NULL,
        'Animated video game adaptation'

    -- TV Shows
    UNION ALL SELECT
        'TV Shows', 'Stranger Things', 'The Duffer Brothers',
        2016, 'In Progress', NULL, 9,
        'Science fiction mystery series'

    UNION ALL SELECT
        'TV Shows', 'Avatar: The Last Airbender',
        'Michael Dante DiMartino and Bryan Konietzko',
        2005, 'Completed', NULL, 10,
        'Animated fantasy adventure'

    UNION ALL SELECT
        'TV Shows', 'Star vs. the Forces of Evil',
        'Daron Nefcy',
        2015, 'Completed', NULL, 8,
        'Animated magical adventure'

    UNION ALL SELECT
        'TV Shows', 'The Mandalorian', 'Jon Favreau',
        2019, 'On Hold', NULL, 8,
        'Star Wars television series'

    -- Books
    UNION ALL SELECT
        'Books', 'The Hobbit', 'J. R. R. Tolkien',
        1937, 'Completed', NULL, 9,
        'Fantasy adventure novel'

    UNION ALL SELECT
        'Books', 'Dune', 'Frank Herbert',
        1965, 'Planned', NULL, NULL,
        'Science fiction novel'

    UNION ALL SELECT
        'Books', 'The Hunger Games', 'Suzanne Collins',
        2008, 'Completed', NULL, 9,
        'Dystopian adventure novel'

    UNION ALL SELECT
        'Books', 'Harry Potter and the Philosopher''s Stone',
        'J. K. Rowling',
        1997, 'In Progress', NULL, 8,
        'Fantasy novel'

    -- Music Albums
    UNION ALL SELECT
        'Music Albums', 'Thriller', 'Michael Jackson',
        1982, 'Completed', NULL, 10,
        'Pop album'

    UNION ALL SELECT
        'Music Albums', '1989', 'Taylor Swift',
        2014, 'Completed', NULL, 9,
        'Pop album'

    UNION ALL SELECT
        'Music Albums', 'Random Access Memories', 'Daft Punk',
        2013, 'Planned', NULL, NULL,
        'Electronic music album'

    UNION ALL SELECT
        'Music Albums', 'Future Nostalgia', 'Dua Lipa',
        2020, 'Completed', NULL, 9,
        'Dance-pop album'
) AS s
JOIN media_types AS t
    ON t.name = s.category
WHERE NOT EXISTS (
    SELECT 1
    FROM media_items AS existing
    WHERE existing.type_id = t.id
      AND existing.title = s.title
);
