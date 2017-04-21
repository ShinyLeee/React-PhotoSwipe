import styled from 'styled-components';

export const SectionHeader = styled.h3`
  margin: 40px 0 20px;
  color: #333;
  text-align: center;
`;

export const JustifiedGallery = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 2px;
  &::after {
    content: '';
    flex-grow: 999999999;
  }
`;

export const ImageHolder = styled.div`
  margin: 2px;
  background-color: #fff;
  position: relative;
`;

export const PlaceHolder = styled.i`
  display: block;
`;

export const Image = styled.img`
  position: absolute;
  top: 0;
  width: 100%;
  vertical-align: bottom;
`;
