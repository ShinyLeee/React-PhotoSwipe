import styled from 'styled-components';
import withGesture from '../gesture/index';

const Wrapper = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
`;

export default withGesture(Wrapper);
