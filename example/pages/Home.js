import React, { Component, PropTypes } from 'react';
import {
  SectionHeader,
  JustifiedLayout,
  ImageHolder,
  PlaceHolder,
  Image,
} from './styled';
import PhotoSwipe from '../../src/index';
// import Template from '../components/Template';

export default class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      items: props.images,
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
      template: type === 'justifiedLayout' && true,
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
          <JustifiedLayout innerRef={(node) => { this.justifiedLayout = node; }}>
            {
              images.map((image, i) => (
                <ImageHolder
                  key={image.id}
                  width={image.width}
                  height={image.height}
                  rowHeight={80}
                >
                  <PlaceHolder width={image.width} height={image.height} />
                  <Image
                    src={image.msrc}
                    onClick={() => this.handleOpenGallery(images, i, 'justifiedLayout')}
                  />
                </ImageHolder>
              ))
            }
          </JustifiedLayout>
        </section>
        <section className="section section__minimal">
          <SectionHeader>Minimal Gallery Example</SectionHeader>
          <JustifiedLayout innerRef={(node) => { this.minimalGallery = node; }}>
            {
              imagesB.map((image, i) => (
                <ImageHolder
                  key={image.id}
                  width={image.width}
                  height={image.height}
                  rowHeight={80}
                >
                  <PlaceHolder width={image.width} height={image.height} />
                  <Image
                    src={image.msrc}
                    onClick={() => this.handleOpenGallery(imagesB, i, 'minimalGallery')}
                  />
                </ImageHolder>
              ))
            }
          </JustifiedLayout>
        </section>
        <PhotoSwipe
          open={this.state.open}
          items={this.state.items}
          initIndex={this.state.startIndex}
          template={this.state.template}
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
      msrc: 'https://c1.staticflickr.com/5/4155/34729323745_5f48b08d11_m.jpg',
      src: 'https://c1.staticflickr.com/5/4155/34729323745_5f48b08d11_b.jpg',
      width: 1024,
      height: 683,
      title: 'Lorem Ipsum',
      desc: '无人爱苦，亦无人寻之欲之，乃因其苦...',
    },
    {
      id: 1,
      msrc: 'https://c1.staticflickr.com/5/4185/34567479622_f20c36c6df_m.jpg',
      src: 'https://c1.staticflickr.com/5/4185/34567479622_f20c36c6df_b.jpg',
      width: 1024,
      height: 683,
      title: 'Very Long desc',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
    {
      id: 2,
      msrc: 'https://c1.staticflickr.com/5/4176/33873416524_6f7747056c_m.jpg',
      src: 'https://c1.staticflickr.com/5/4176/33873416524_73c412f3ac_k.jpg',
      width: 539,
      height: 2048,
    },
    { id: 3,
      msrc: 'https://c1.staticflickr.com/5/4180/33906312003_65219c00d0_m.jpg',
      src: 'https://c1.staticflickr.com/5/4180/33906312003_65219c00d0_b.jpg',
      width: 1024,
      height: 683,
    },
    { id: 4,
      msrc: 'https://c1.staticflickr.com/5/4161/33873409014_3bfc13000b_m.jpg',
      src: 'https://c1.staticflickr.com/5/4161/33873409014_3bfc13000b_b.jpg',
      width: 1024,
      height: 683,
    },
    {
      id: 5,
      msrc: 'https://c1.staticflickr.com/5/4193/33920093523_c652cca848_m.jpg',
      src: 'https://c1.staticflickr.com/5/4193/33920093523_c652cca848_b.jpg',
      width: 683,
      height: 1024,
    },
  ],
};

Home.propTypes = {
  images: PropTypes.array.isRequired,
};
