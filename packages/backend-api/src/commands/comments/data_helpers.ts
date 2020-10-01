import {logger} from '../../logger';
import {
  Article,
  Category,
  Comment, IArticleInstance,
  IAuthorAttributes,
  ICategoryInstance,
  IUserInstance,
  RESET_COUNTS
} from '../../models';
import {postProcessComment, sendForScoring} from '../../pipeline';

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export async function createCategory(owner: IUserInstance | null, label: string) {
  const category = await Category.create({
    ownerId: owner?.id,
    label,
    sourceId: guid(),
    ...RESET_COUNTS,
  });

  logger.info(`Generated category ${category.id}: ${category.label}`);
  return category;
}

export async function createArticle(
  category: ICategoryInstance,
  title: string,
  text: string,
  url: string,
  ) {
  const article = await Article.create({
    categoryId: category.id,
    ownerId: category.ownerId,
    sourceId: guid(),
    title,
    text,
    url,
    sourceCreatedAt: new Date(Date.now()),
    isCommentingEnabled: true,
    isAutoModerated: true,
    ...RESET_COUNTS,
  });

  logger.info(`Created article ${article.id}: ${article.title}`);

  return article;
}

export async function createComment(
  article: IArticleInstance,
  authorName: string,
  text: string,
) {
  const author: IAuthorAttributes = {
    name: authorName,
  };

  const comment = await Comment.create({
    articleId: article.id,
    ownerId: article.ownerId,
    sourceId: guid(),
    sourceCreatedAt: new Date(Date.now()),
    authorSourceId: guid(),
    author,
    text,
  });

  await postProcessComment(comment);
  await sendForScoring(comment);

  return comment;
}
