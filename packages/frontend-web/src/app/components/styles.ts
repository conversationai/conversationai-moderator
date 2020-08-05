import {
  BODY_TEXT_TYPE, BUTTON_LINK_TYPE, BUTTON_RESET,
  CAPTION_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_SECONDARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  NICE_MIDDLE_BLUE,
} from '../styles';
import { stylesheet } from '../utilx';

export const COMMENT_HEADER_BACKGROUND_COLOR = '#F5F7F9';

export const ROW_STYLES = stylesheet({
  meta: {
    ...CAPTION_TYPE,
    color: DARK_SECONDARY_TEXT_COLOR,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '46px',
  },

  authorRow: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
  },

  commentContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    paddingBottom: `${GUTTER_DEFAULT_SPACING / 2}px`,
  },

  comment: {
    ...BODY_TEXT_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  reply: {
    fill: DARK_TERTIARY_TEXT_COLOR,
    marginBottom: 3,
    marginRight: 4,
    verticalAlign: 'top',
  },

  actionToggle: {
    ...BUTTON_RESET,
    padding: `${GUTTER_DEFAULT_SPACING / 2}px`,
    marginRight: `${GUTTER_DEFAULT_SPACING / 4}px`,
    ':focus': {
      outline: 0,
      backgroundColor: `${COMMENT_HEADER_BACKGROUND_COLOR}`,
    },
  },

  detailsButton: {
    ...BUTTON_LINK_TYPE,
    flex: 1,
    border: 'none',
    borderRadius: 0,
    color: NICE_MIDDLE_BLUE,
    cursor: 'pointer',
    textAlign: 'right',
    fontSize: '12px',
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
    ':hover': {
      textDecoration: 'underline',
    },

    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  actionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
