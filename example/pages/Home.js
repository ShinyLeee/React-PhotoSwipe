import React, { Component, PropTypes } from 'react';
import {
  SectionHeader,
  JustifiedGallery,
  ImageHolder,
  PlaceHolder,
  Image,
} from './styled';
import PhotoSwipe from '../../src/index';
import Template from '../components/Template';

export default class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      items: props.images,
      startIndex: undefined,
      template: <Template />,
      sourceElement: undefined,
    };
    this.handleOpenGallery = this.handleOpenGallery.bind(this);
  }

  handleOpenGallery(items, startIndex, type) {
    this.setState({
      open: true,
      items,
      startIndex,
      template: type === 'justifiedGallery' ? <Template /> : false,
      sourceElement: this[type],
    });
  }

  render() {
    const { images } = this.props;
    const imagesB = images.slice(0, 2);
    return (
      <main>
        <section className="section section__justified">
          <SectionHeader>Justified Gallery Example</SectionHeader>
          <JustifiedGallery innerRef={(node) => { this.justifiedGallery = node; }}>
            {
              images.map((image, i) => (
                <ImageHolder
                  key={image.id}
                  style={{ width: `${(image.width * 200) / image.height}px`, flexGrow: `${(image.width * 200) / image.height}` }}
                >
                  <PlaceHolder style={{ paddingBottom: `${(image.height / image.width) * 100}%` }} />
                  <Image
                    src={image.src}
                    alt={`${image.id}.jpg`}
                    onClick={() => this.handleOpenGallery(images, i, 'justifiedGallery')}
                  />
                </ImageHolder>
              ))
            }
          </JustifiedGallery>
        </section>
        <section className="section section__minimal">
          <SectionHeader>Minimal Gallery Example</SectionHeader>
          <JustifiedGallery innerRef={(node) => { this.minimalGallery = node; }}>
            {
              imagesB.map((image, i) => (
                <ImageHolder
                  key={image.id}
                  style={{ width: `${(image.width * 200) / image.height}px`, flexGrow: `${(image.width * 200) / image.height}` }}
                >
                  <PlaceHolder style={{ paddingBottom: `${(image.height / image.width) * 100}%` }} />
                  <Image
                    src={image.src}
                    alt={`${image.id}.jpg`}
                    onClick={() => this.handleOpenGallery(imagesB, i, 'minimalGallery')}
                  />
                </ImageHolder>
              ))
            }
          </JustifiedGallery>
        </section>
        <PhotoSwipe
          open={this.state.open}
          items={this.state.items}
          initIndex={this.state.startIndex}
          template={this.state.template ? <Template /> : false}
          sourceElement={this.state.sourceElement}
          onClose={() => this.setState({ open: false })}
        />
      </main>
    );
  }
}

Home.displayName = 'HomePage';

Home.defaultProps = {
  images: [
    {
      id: 0,
      src: '../img/0.jpg',
      width: 1080,
      height: 831,
      title: 'Lorem Ipsum',
      desc: '无人爱苦，亦无人寻之欲之，乃因其苦...',
    },
    {
      id: 1,
      src: '../img/1.jpg',
      width: 474,
      height: 523,
    },
    {
      id: 2,
      src: '../img/2.jpg',
      width: 640,
      height: 1922,
    },
    { id: 3,
      src: '../img/3.jpg',
      width: 2400,
      height: 1600,
    },
    { id: 4,
      src: '../img/4.jpg',
      width: 2400,
      height: 1600,
    },
    {
      id: 5,
      src: '../img/5.jpg',
      width: 1674,
      height: 6362,
    },
  ],
};

Home.propTypes = {
  images: PropTypes.array.isRequired,
};
