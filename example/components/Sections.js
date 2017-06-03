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
} from './Sections.styled';

export default class Sections extends Component {

  shouldComponentUpdate(nextProps) {
    return nextProps.minimal.length !== this.props.minimal.length ||
      nextProps.justified.length !== this.props.justified.length ||
      nextProps.grid.length !== this.props.grid.length;
  }

  render() {
    const { minimal, justified, grid, minimalRef, justifiedRef, gridRef } = this.props;
    return (
      <main>
        <section className="section section__minimal">
          <SectionHeader>Minimal Layout Example</SectionHeader>
          <JustifiedLayout innerRef={minimalRef}>
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
                    onClick={() => this.props.onThumbClick(minimal, i, 'minimalLayout')}
                  />
                </ImageHolder>
              ))
            }
          </JustifiedLayout>
        </section>
        <section className="section section__justified">
          <SectionHeader>Justified Layout Example</SectionHeader>
          <JustifiedLayout innerRef={justifiedRef}>
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
                    onClick={() => this.props.onThumbClick(justified, i, 'justifiedLayout')}
                  />
                </ImageHolder>
              ))
            }
          </JustifiedLayout>
        </section>
        <section className="section section__grid">
          <SectionHeader>Grid Layout Example</SectionHeader>
          <GridLayout
            innerRef={gridRef}
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
                      onClick={() => this.props.onThumbClick(grid, i, 'gridLayout')}
                    />
                  </GridImageHolder>
                </GridTile>
              ))
            }
          </GridLayout>
        </section>
      </main>
    );
  }
}

Sections.propTypes = {
  minimal: PropTypes.array.isRequired,
  justified: PropTypes.array.isRequired,
  grid: PropTypes.array.isRequired,
  minimalRef: PropTypes.func.isRequired,
  justifiedRef: PropTypes.func.isRequired,
  gridRef: PropTypes.func.isRequired,
  onThumbClick: PropTypes.func.isRequired,
};
