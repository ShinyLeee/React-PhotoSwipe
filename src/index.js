import React, { Component, PropTypes } from 'react';
import ItemHolder from './components/itemHolder';
import UITemplate from './components/ui-template';
import { Wrapper, Overlay, Container } from './styled';
import { on, off, isDomElement } from './utils';
import { PAN_FRICTION_LEVEL, SWIPE_TO_DURATION, BOUNCE_BACK_DURATION } from './utils/constant';
import animationEngine from './utils/animation';

const rAF = animationEngine.rAF.bind(animationEngine);

export default class PhotoSwipe extends Component {
  constructor(props) {
    super(props);
    this.indexDiff = 0;
    this.state = {
      open: false,
      currIndex: props.initIndex,
      vwWidth: window.innerWidth,
      vwHeight: window.innerHeight,
      itemHolders: undefined,
      isTemplateOpen: props.template ? true : undefined,
    };
    this.handleViewChange = this.handleViewChange.bind(this);
    this.handleInnerClose = this.handleInnerClose.bind(this);
    this.handleItemTap = this.handleItemTap.bind(this);
    this.handleItemDoubleTap = this.handleItemDoubleTap.bind(this);
    this.handleItemPan = this.handleItemPan.bind(this);
    this.handleItemSwipe = this.handleItemSwipe.bind(this);
  }

  componentDidMount() {
    on(window, 'scroll resize orientationchange', this.handleViewChange);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.open !== this.props.open) {
      this.setState(prevState => ({
        open: nextProps.open,
        currIndex: nextProps.open ? nextProps.initIndex : prevState.currIndex,
        itemHolders: nextProps.open
        ? this.initItemHolders(nextProps)
        : prevState.itemHolders.map(item => React.cloneElement(item, { open: false })),
      }));
    }
  }

  componentDidUpdate(prevProps) {
    // Reset some value when close gallery
    if (prevProps.open !== this.props.open && !this.props.open) {
      this.indexDiff = 0;
      this.applyContainerTransform(0, 0);
    }
  }

  componentWillUnmount() {
    off(window, 'scroll resize orientationchange', this.handleViewChange);
  }

  getItemIndex(index, nextProps) {
    let itemIndex = index;

    const props = nextProps || this.props;
    const itemLen = props.items.length;

    // loop always `false` when there are less than 3 slides
    const loop = itemLen < 3 ? false : props.loop;

    if (index > itemLen - 1) {
      itemIndex = loop ? index - itemLen : undefined;
    } else if (index < 0) {
      itemIndex = loop ? itemLen + index : undefined;
    }
    return itemIndex;
  }

  get wrapperXPos() {
    return -Math.round(this.indexDiff * this.state.vwWidth * (1 + this.props.spacing));
  }

  applyContainerTransform(x, y) {
    this.container.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
  }

  initItemHolders(nextProps) {
    const { open, initIndex, items, ...other } = nextProps;
    const { vwWidth, vwHeight } = this.state;
    const prevIndex = this.getItemIndex(initIndex - 1, nextProps);
    const nextIndex = this.getItemIndex(initIndex + 1, nextProps);
    return [
      prevIndex !== undefined ? <ItemHolder
        key={items[prevIndex].id}
        open={open}
        itemIndex={prevIndex}
        currIndex={initIndex}
        indexDiff={-1}
        item={items[prevIndex]}
        viewportSize={{ width: vwWidth, height: vwHeight }}
        overlay={this.overlay}
        onTap={this.handleItemTap}
        onDoubleTap={this.handleItemDoubleTap}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onInnerClose={this.handleInnerClose}
        {...other}
      /> : <div key="React-PhotoSwipe_prevItemPlaceHolder" />,
      <ItemHolder
        key={items[initIndex].id}
        item={items[initIndex]}
        open={open}
        itemIndex={initIndex}
        currIndex={initIndex}
        indexDiff={0}
        viewportSize={{ width: vwWidth, height: vwHeight }}
        overlay={this.overlay}
        onTap={this.handleItemTap}
        onDoubleTap={this.handleItemDoubleTap}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onInnerClose={this.handleInnerClose}
        {...other}
      />,
      nextIndex !== undefined ? <ItemHolder
        key={items[nextIndex].id}
        item={items[nextIndex]}
        open={open}
        itemIndex={nextIndex}
        currIndex={initIndex}
        indexDiff={1}
        viewportSize={{ width: vwWidth, height: vwHeight }}
        overlay={this.overlay}
        onTap={this.handleItemTap}
        onDoubleTap={this.handleItemDoubleTap}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onInnerClose={this.handleInnerClose}
        {...other}
      /> : <div key="React-PhotoSwipe_nextItemPlaceHolder" />,
    ];
  }

  /**
   *
   * @param {Object} prevState - previous react state object
   * @param {Number} indexDiff - swipe to left / next(1) or right / prev(-1)
   * @param {Number} nextIndex - The item index that swipe to
   * @param {Number} replIndex - The item index that wait to be replaced
   * @param {Number} appdIndex - The item index that wait to be appended
   *
   * @return {Object} newItemHolders - An updatedItemHolders react component object
   */
  updateItemHolders(prevState, indexDiff, nextIndex, replIndex, appdIndex) {
    const { items, loop, ...other } = this.props;
    const { open, vwWidth, vwHeight, itemHolders } = prevState;
    let newItemHolders = [...itemHolders];

    const replArrIndex = itemHolders.map(item => item.props.itemIndex).indexOf(replIndex);

    const newItemHolder = appdIndex === undefined
    ? <div key={indexDiff > 0 ? 'nextItemPlaceHolder' : 'prevItemPlaceHolder'} />
    : (
      <ItemHolder
        key={items[appdIndex].id}
        item={items[appdIndex]}
        open={open}
        itemIndex={appdIndex}
        currIndex={nextIndex}
        indexDiff={indexDiff > 0 ? this.indexDiff + 1 : this.indexDiff - 1}
        viewportSize={{ width: vwWidth, height: vwHeight }}
        overlay={this.overlay}
        onTap={this.handleItemTap}
        onDoubleTap={this.handleItemDoubleTap}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onInnerClose={this.handleInnerClose}
        {...other}
      />
    );
    newItemHolders.splice(replArrIndex, 1, newItemHolder);
    // Force to update currIndex prop
    // not use React.children.map cuz it will change the original key and cause remount.
    newItemHolders = newItemHolders.map(item => React.cloneElement(item, { currIndex: nextIndex }));
    return newItemHolders;
  }

  requestContainerAnimation(startXPos, endXPos, bounceBack, callback) {
    rAF(
      'swipe',
      startXPos,
      endXPos,
      bounceBack ? BOUNCE_BACK_DURATION : SWIPE_TO_DURATION,
      'sineOut',
      pos => this.applyContainerTransform(pos, 0),
      () => callback && callback(),
    );
  }

  handleViewChange() {
    const { vwWidth, vwHeight } = this.state;
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    if (vwHeight !== innerHeight || vwWidth !== innerWidth) {
      this.setState({
        vwWidth: innerWidth,
        vwHeight: innerHeight,
      });
    }
  }

  handleInnerClose() {
    this.setState({ open: false, isTemplateOpen: true });
    if (this.props.onInnerClose) {
      this.props.onInnerClose();
    }
  }

  handleItemTap() {
    const { template } = this.props;
    if (template) {
      this.setState(prevState => ({ isTemplateOpen: !prevState.isTemplateOpen }));
    }
  }

  handleItemDoubleTap() {
    if (this.props.onDoubleTap) {
      this.props.onDoubleTap();
    }
  }

  handleItemPan(direction, panDelta) {
    const { items, loop } = this.props;
    const { currIndex } = this.state;
    if (direction === 'lr') {
      let xPos = this.wrapperXPos + panDelta.accX;
      if (!loop || items.length < 3) {
        if (
          (panDelta.accX > 0 && this.getItemIndex(currIndex - 1) === undefined) ||
          (panDelta.accX < 0 && this.getItemIndex(currIndex + 1) === undefined)
        ) {
          xPos = this.wrapperXPos + (panDelta.accX * PAN_FRICTION_LEVEL);
          this.applyContainerTransform(xPos, 0);
          return;
        }
      }
      this.applyContainerTransform(xPos, 0);
    } else if (direction === 'ud') {
      if (this.state.isTemplateOpen) {
        this.setState({ isTemplateOpen: false });
      }
    }
  }

  handleItemSwipe(direction, delta) {
    const {
      items,
      loop,
      swipeToThreshold,
    } = this.props;
    if (direction === 'Left' || direction === 'Right') {
      if (Math.abs(delta.accX) > (swipeToThreshold * this.state.vwWidth)) {
        if (!loop || items.length < 3) {
          if (
            (direction === 'Right' && this.getItemIndex(this.state.currIndex - 1) === undefined) ||
            (direction === 'Left' && this.getItemIndex(this.state.currIndex + 1) === undefined)
          ) {
            const startXPos = this.wrapperXPos + (delta.accX * PAN_FRICTION_LEVEL);
            const endXPos = this.wrapperXPos;
            this.requestContainerAnimation(startXPos, endXPos, false);
            return;
          }
        }
        const startXPos = this.wrapperXPos + delta.accX;
        const isToLeft = direction === 'Left';
        if (isToLeft) this.indexDiff += 1;
        else this.indexDiff -= 1;
        const endXPos = this.wrapperXPos; // Need update this.indexDiff in advance
        this.requestContainerAnimation(startXPos, endXPos, true, () => {
          this.setState((prevState) => {
            const indexDiff = isToLeft ? 1 : -1;
            const nextIndex = isToLeft
                              ? this.getItemIndex(prevState.currIndex + 1)
                              : this.getItemIndex(prevState.currIndex - 1);
            const replIndex = isToLeft
                              ? this.getItemIndex(prevState.currIndex - 1)
                              : this.getItemIndex(prevState.currIndex + 1);
            const appdIndex = isToLeft
                              ? this.getItemIndex(prevState.currIndex + 2)
                              : this.getItemIndex(prevState.currIndex - 2);
            const nextItemHolders = items.length < 3
                                    ? prevState.itemHolders
                                    : this.updateItemHolders(prevState, indexDiff, nextIndex, replIndex, appdIndex); // eslint-disable-line max-len
            return {
              currIndex: nextIndex,
              itemHolders: nextItemHolders,
            };
          });
        });
      } else {
        const startXPos = this.wrapperXPos + delta.accX;
        const endXPos = this.wrapperXPos;
        this.requestContainerAnimation(startXPos, endXPos, false);
      }
    }
  }

  render() {
    const { initIndex, items, template } = this.props;
    return (
      <Wrapper open={this.state.open}>
        <Overlay
          open={this.state.open}
          innerRef={(node) => { this.overlay = node; }}
        />
        <Container
          open={this.state.open}
          innerRef={(node) => { this.container = node; }}
        >
          { initIndex !== undefined && this.state.itemHolders }
        </Container>
        {
          React.isValidElement(template)
          ? React.cloneElement(template, {
            open: this.state.open && this.state.isTemplateOpen,
            currIndex: this.state.currIndex,
            items,
            onInnerClose: this.handleInnerClose,
          })
          : template && (
            <UITemplate
              open={this.state.open && this.state.isTemplateOpen}
              currIndex={this.state.currIndex}
              items={items}
              onInnerClose={this.handleInnerClose}
            />
          )
        }
      </Wrapper>
    );
  }
}

PhotoSwipe.displayName = 'React-Photo-Swipe';

PhotoSwipe.defaultProps = {
  open: false,

  // If true image will be able to click or swipe from last to first.
  loop: true,

  // If true, use default ui-template.
  // If false, a minimal gallery without ui-template.
  // If a react element, means customize the whole ui-template
  template: true,

  showAnimateDuration: 333,
  hideAnimateDuration: 333,

  // Spacing ratio between slides.
  // For example, 0.12 will render as a 12% of sliding viewport width.
  spacing: 0.12,

  // Maximum swipe distance based on percentage of viewport width,
  // exceed it swipe left or right will swipe to next or prev image.
  swipeToThreshold: 0.4,

  // Maximum swipe distance based on percentage of viewport height,
  // exceed it swipe down or up will swipe to close gallery.
  swipeToCloseThreshold: 0.2,

  // Minimum pinch scale based on percentage of original item
  // below it when pinchEnd will close gallery.
  // Set zero pinch will never close gallery.
  pinchToCloseThreshold: 0,

  // Maximum zoom scale based on item dimension when performing zoom gesture
  maxZoomScale: 1,
};

PhotoSwipe.propTypes = {
  open: PropTypes.bool.isRequired,
  initIndex: PropTypes.number,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
    src: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  })).isRequired,
  sourceElement: isDomElement,
  loop: PropTypes.bool,
  template: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.element,
  ]),
  showAnimateDuration: PropTypes.number,
  hideAnimateDuration: PropTypes.number,
  spacing: PropTypes.number,
  swipeToThreshold: PropTypes.number,
  swipeToCloseThreshold: PropTypes.number,
  pinchToCloseThreshold: PropTypes.number,
  maxZoomScale: PropTypes.number,
  onInnerClose: PropTypes.func.isRequired,
  onDoubleTap: PropTypes.func,
};
