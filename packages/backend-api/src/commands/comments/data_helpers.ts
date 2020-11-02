import {logger} from '../../logger';
import {
  Article,
  Category,
  Comment,
  IAuthorAttributes,
  RESET_COUNTS,
  User,
  USER_GROUP_SERVICE,
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

export async function createOwner(name: string) {
  const [owner, ] = await User.findOrCreate({
    where: {name: 'alice service user'},
    defaults: {
      name: name,
      group: USER_GROUP_SERVICE,
      isActive: true,
    },
  });
  return owner;
}

export async function createCategory(owner: User | null, label: string) {
  const [category, created] = await Category.findOrCreate({
    where: {label},
    defaults: {
      ownerId: owner?.id,
      label,
      sourceId: guid(),
      ...RESET_COUNTS,
    },
  });

  if (created) {
    logger.info(`Generated category ${category.id}: ${category.label}`);
  }

  return category;
}

export async function createArticle(
  category: Category,
  title: string,
  text: string,
  url: string,
) {
  const [article, created] = await Article.findOrCreate({
    where: {title},
    defaults: {
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
    },
  });

  if (created) {
    logger.info(`Created article ${article.id}: ${article.title}`);
  }

  return article;
}

export async function createComment(
  article: Article,
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
