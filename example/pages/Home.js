import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Sections from '../components/Sections';
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
      <div>
        <Sections
          minimal={minimal}
          justified={justified}
          grid={grid}
          minimalRef={(el) => { this.minimalLayout = el; }}
          justifiedRef={(el) => { this.justifiedLayout = el; }}
          gridRef={(el) => { this.gridLayout = el; }}
          onThumbClick={this.handleOpenGallery}
        />
        <PhotoSwipe
          open={this.state.open}
          items={this.state.items}
          initIndex={this.state.startIndex}
          cropped={this.state.cropped}
          sourceElement={this.state.sourceElement}
          template={this.state.template}
          onClose={() => this.setState({ open: false })}
        />
      </div>
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
