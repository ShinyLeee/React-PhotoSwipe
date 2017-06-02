import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  SectionHeader,
  JustifiedLayout,
  ImageHolder,
  PlaceHolder,
  Image,
  GridLayout,
  GridTile,
  GridImageHolder,
  GridImage,
} from './styled';
import PhotoSwipe from '../../src/index';
import { imagesA, imagesB, imagesC } from '../fixtures/imageData';

export default class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      items: props.minimal,
      startIndex: undefined,
      template: true,
      sourceElement: undefined,
    };
    this.handleOpenGallery = this.handleOpenGallery.bind(this);
  }

  handleOpenGallery(items, startIndex, type) {
    this.setState({
      open: true,
      items,
      startIndex,
      cropped: type === 'gridLayout',
      sourceElement: this[type],
      template: type === 'justifiedLayout',
    });
  }

  render() {
    const { minimal, justified, grid } = this.props;
    return (
      <main>
        <section className="section section__minimal">
          <SectionHeader>Minimal Layout Example</SectionHeader>
          <JustifiedLayout innerRef={(node) => { this.minimalLayout = node; }}>
            {
              minimal.map((image, i) => (
                <ImageHolder
                  key={image.id}
                  width={image.width}
                  height={image.height}
                  rowHeight={80}
                >
                  <PlaceHolder width={image.width} height={image.height} />
                  <Image
                    src={image.msrc}
                    onClick={() => this.handleOpenGallery(minimal, i, 'minimalLayout')}
                  />
                </ImageHolder>
              ))
            }
          </JustifiedLayout>
        </section>
        <section className="section section__justified">
          <SectionHeader>Justified Layout Example</SectionHeader>
          <JustifiedLayout innerRef={(node) => { this.justifiedLayout = node; }}>
            {
              justified.map((image, i) => (
                <ImageHolder
                  key={image.id}
                  width={image.width}
                  height={image.height}
                  rowHeight={80}
                >
                  <PlaceHolder width={image.width} height={image.height} />
                  <Image
                    src={image.msrc}
                    onClick={() => this.handleOpenGallery(justified, i, 'justifiedLayout')}
                  />
                </ImageHolder>
              ))
            }
          </JustifiedLayout>
        </section>
        <section className="section section__grid">
          <SectionHeader>Grid Layout Example</SectionHeader>
          <GridLayout
            innerRef={(node) => { this.gridLayout = node; }}
            gap={4}
          >
            {
              grid.map((image, i) => (
                <GridTile
                  key={image.id}
                  columns={3}
                  gap={4}
                >
                  <GridImageHolder>
                    <GridImage
                      src={image.msrc}
                      onClick={() => this.handleOpenGallery(grid, i, 'gridLayout')}
                    />
                  </GridImageHolder>
                </GridTile>
              ))
            }
          </GridLayout>
        </section>
        <PhotoSwipe
          open={this.state.open}
          items={this.state.items}
          initIndex={this.state.startIndex}
          cropped={this.state.cropped}
          sourceElement={this.state.sourceElement}
          template={this.state.template}
          onClose={() => this.setState({ open: false })}
        />
      </main>
    );
  }
}

Home.displayName = 'HomePage';

Home.defaultProps = {
  minimal: imagesA,
  justified: imagesB,
  grid: imagesC,
};

Home.propTypes = {
  minimal: PropTypes.array.isRequired,
  justified: PropTypes.array.isRequired,
  grid: PropTypes.array.isRequired,
};
