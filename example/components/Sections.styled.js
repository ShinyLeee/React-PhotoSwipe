import styled from 'styled-components';

const SectionHeader = styled.h3`
  margin: 40px 0 20px;
  color: #333;
  text-align: center;
`;

const JustifiedLayout = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 2px;
  &::after {
    content: '';
    flex-grow: 999999999;
  }
`;

const ImageHolder = styled.div`
  position: relative;
  width: ${props => `${(props.width * props.rowHeight) / props.height}px`};
  flex-grow: ${props => (props.width * props.rowHeight) / props.height};
  margin: 2px;
  background-color: #fff;
  overflow: hidden;
`;

const PlaceHolder = styled.i`
  display: block;
  padding-bottom: ${props => `${(props.height / props.width) * 100}%`}
`;

const Image = styled.img`
  position: absolute;
  top: 0;
  width: 100%;
  vertical-align: bottom;
`;

const GridLayout = styled.div`
  margin: ${props => `-${props.gap / 2}px`};
`;

const GridTile = styled.div`
  position: relative;
  display: inline-block;
  width: ${props => `${(100 / props.columns)}%`};
  height: 0;
  padding: ${props => `0 ${props.gap / 2}px`};
  padding-bottom: ${props => `${100 / props.columns}%`};
  vertical-align: top;
`;

const GridImageHolder = styled.div`
  position: absolute;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  background-color: #eee;
  transform: translate3d(0px, 0px, 0px);
  overflow: hidden;
`;

const GridImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

SectionHeader.displayName = 'Sc__SectionHeader';
JustifiedLayout.displayName = 'Sc__JustifiedLayout';
ImageHolder.displayName = 'Sc__ImageHolder';
PlaceHolder.displayName = 'Sc__PlaceHolder';
Image.displayName = 'Sc__Image';
GridLayout.displayName = 'Sc__GridLayout';
GridTile.displayName = 'Sc__GridTile';
GridImageHolder.displayName = 'Sc__GridImageHolder';
GridImage.displayName = 'Sc__GridImage';

export {
  SectionHeader,
  JustifiedLayout,
  ImageHolder,
  PlaceHolder,
  Image,
  GridLayout,
  GridTile,
  GridImageHolder,
  GridImage,
};

