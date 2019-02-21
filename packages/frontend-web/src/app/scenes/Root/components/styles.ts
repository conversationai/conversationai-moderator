import {stylesheet} from '../../../utilx';

export const ROOT_STYLES = stylesheet({
  base: { height: '100%' },

  placeholder: {
    fontSize: '40px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  header2Tag: {
    position: 'absolute',
    top: '2vh',
    right: '2vh',
    height: '3vh',
    fontSize: '2.5vh',
    paddingTop: '0.5vh',
    fontWeight: 500,
    color: 'white',
  },

  fadeIn: {
    animationName: {
      from: {
        opacity: 0,
      },

      to: {
        opacity: 1,
      },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
    animationIterationCount: 1,
  },

  link: {
    color: 'white',
    ':hover': {
      textDecoration: 'underline',
    },
  },

  errors: {
    position: 'absolute',
    bottom: '15vh',
    width: '100%',
    padding: '0 20vw',
    textAlign: 'center',
    fontSize: '2vh',
    color: 'white',
  },

  errorsTryAgain: {
    fontSize: '2.5vh',
  },
});
