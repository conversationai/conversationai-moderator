
 -- articles with counts of real comments, and the table's counts cache for
 -- and unmoderated and moderated.
CREATE VIEW articles_with_counts AS
  SELECT a.id, a.categoryId, a.unmoderatedCount, a.moderatedCount, m.commentCount, a.title
   FROM
    ((SELECT articleId, COUNT(*) as commentCount
      FROM comments GROUP BY articleId) AS m
    INNER JOIN articles AS a
    ON a.id = m.articleId);

-- Categories with the counts
CREATE VIEW category_ids_with_counts AS
   (SELECT categoryId, COUNT(*) as articleCount,
       SUM(commentCount) as commentCount,
       SUM(unmoderatedCount) as unmoderatedCount,
       SUM(moderatedCount) as moderatedCount
    FROM articles_with_counts
    GROUP BY categoryId);

-- Named categories with counts
CREATE VIEW categories_with_counts AS
  (SELECT g.id, g.label, g.unmoderatedCount,
          g.moderatedCount, c.articleCount, c.commentCount
    FROM (category_ids_with_counts AS c
    INNER JOIN categories AS g
    ON c.categoryId = g.id));

-- See counter for some articles.
SELECT * FROM articles_with_counts LIMIT 10;

-- See the counts for categories
SELECT * FROM categories_with_counts LIMIT 10;

-- Reset Article Counts
UPDATE articles AS a
INNER JOIN articles_with_counts AS c
ON a.id = c.id
SET
  a.moderatedCount = 0,
  a.unmoderatedCount = c.commentCount;

-- Update Category Counts
UPDATE categories AS g
INNER JOIN categories_with_counts AS c
ON g.id = c.id
SET
  g.moderatedCount = 0,
  g.unmoderatedCount = c.commentCount;

-- Reset comment's moderation state
UPDATE comments SET
 isModerated = false,
 sentBackToPublisher = NULL,
 isAccepted = false,
 isDeferred = false,
 isHighlighted = false,
 isBatchResolved = false,
 isAutoResolved = false;

-- Remove the decisions made
DELETE FROM decisions;

-- Reset article counts
UPDATE articles SET
moderatedCount = 0,
highlightedCount = 0,
approvedCount = 0,
rejectedCount = 0,
deferedCount = 0,
batchedCount = 0;

-- Reset category counts
UPDATE categories SET
moderatedCount = 0,
highlightedCount = 0,
approvedCount = 0,
rejectedCount = 0,
deferedCount = 0,
batchedCount = 0;
