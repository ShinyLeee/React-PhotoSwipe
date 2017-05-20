import React, { Component, PropTypes } from 'react';
import ItemHolder from './components/itemHolder';
import UITemplate from './components/ui-template';
import ErrorBox from './components/errorBox';
import { Wrapper, Overlay, Container } from './styled';
import { getScrollY, isDomElement } from './utils';
import { on, off } from './utils/event';
import { PAN_FRICTION_LEVEL, SWIPE_TO_DURATION, BOUNCE_BACK_DURATION } from './utils/constant';
import { animate } from './utils/animation';

export default class PhotoSwipe extends Component {
  constructor(props) {
    super(props);
    this.indexDiff = 0;
    this.scrollYOffset = null;
    this.viewportSize = { width: window.innerWidth, height: window.innerHeight };
    this.loadedItems = []; // store loaded items' index
    this.state = {
      open: false,
      currIndex: props.initIndex,
      itemHolders: undefined,
      loaded: false,
      isTemplateOpen: false, // open template after zoom in
    };
    this.zoomOutItemHolders = this.zoomOutItemHolders.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
    this.handleItemTap = this.handleItemTap.bind(this);
    this.handleItemDoubleTap = this.handleItemDoubleTap.bind(this);
    this.handleItemPan = this.handleItemPan.bind(this);
    this.handleItemSwipe = this.handleItemSwipe.bind(this);
    this.handleItemPinchStart = this.handleItemPinchStart.bind(this);
    this.handleBeforeItemZoomIn = this.handleBeforeItemZoomIn.bind(this);
    this.handleAfterItemZoomIn = this.handleAfterItemZoomIn.bind(this);
    this.handleItemLoad = this.handleItemLoad.bind(this);
    this.handleItemReset = this.handleItemReset.bind(this);
    this.handleBeforeItemZoomOut = this.handleBeforeItemZoomOut.bind(this);
    this.handleAfterItemZoomOut = this.handleAfterItemZoomOut.bind(this);
  }

  componentDidMount() {
    on(window, 'resize orientationchange', this.handleViewChange);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.open !== nextProps.open) {
      if (nextProps.open) {
        this.scrollYOffset = getScrollY();
      } else {
        this.scrollYOffset = null;
      }
      this.setState(prevState => ({
        open: nextProps.open,
        currIndex: nextProps.open ? nextProps.initIndex : prevState.currIndex,
        itemHolders: nextProps.open
        ? this.initItemHolders(nextProps)
        : this.updateItemHolders(prevState.itemHolders, { open: false }),
      }));
    }
  }

  componentDidUpdate(prevProps) {
    // Reset when close gallery
    if (prevProps.open !== this.props.open && !this.props.open) {
      this.indexDiff = 0;
      this.applyContainerTransform(0, 0);
    }
  }

  componentWillUnmount() {
    off(window, 'resize orientationchange', this.handleViewChange);
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
    return -Math.round(this.indexDiff * this.viewportSize.width * (1 + this.props.spacing));
  }

  applyContainerTransform(x, y) {
    this.container.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
  }

  generateItemHolder(itemIndex, currIndex, indexDiff, props) {
    const { items, open, ...others } = props;
    return (
      <ItemHolder
        key={items[itemIndex].id}
        open={open}
        item={items[itemIndex]}
        itemIndex={itemIndex}
        currIndex={currIndex}
        indexDiff={indexDiff}
        viewportSize={this.viewportSize}
        overlay={this.overlay}
        onTap={this.handleItemTap}
        onDoubleTap={this.handleItemDoubleTap}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onPinchStart={this.handleItemPinchStart}
        beforeZoomIn={this.handleBeforeItemZoomIn}
        afterZoomIn={this.handleAfterItemZoomIn}
        onItemLoad={this.handleItemLoad}
        beforeZoomOut={this.handleBeforeItemZoomOut}
        afterZoomOut={this.handleAfterItemZoomOut}
        afterReset={this.handleItemReset}
        {...others}
      />);
  }

  initItemHolders(nextProps) {
    const { initIndex } = nextProps;
    const prevIndex = this.getItemIndex(initIndex - 1, nextProps);
    const nextIndex = this.getItemIndex(initIndex + 1, nextProps);
    return [
      prevIndex !== undefined && this.generateItemHolder(prevIndex, initIndex, -1, nextProps),
      this.generateItemHolder(initIndex, initIndex, 0, nextProps),
      nextIndex !== undefined && this.generateItemHolder(nextIndex, initIndex, 1, nextProps),
    ].filter(item => item);
  }

  updateItemHolders(itemHolders, props) { // eslint-disable-line class-methods-use-this
    // Force to update itemHolders props,
    // not use React.children.map cuz it will change the original key and cause remount.
    return itemHolders.map(item => React.cloneElement(item, props));
  }

  /**
   *
   * @param {Object} prevState - previous react state object
   * @param {Number} indexDiff - swipe to left / next(1) or right / prev(-1)
   * @param {Number} nextIndex - The item index that swipe to
   * @param {Number} replIndex - The item index that wait to be replaced
   * @param {Number} appdIndex - The item index that wait to be appended
   */
  replaceItemHolders(prevState, indexDiff, nextIndex, replIndex, appdIndex) {
    const { itemHolders } = prevState;
    const replArrIndex = itemHolders.map(item => item.props.itemIndex).indexOf(replIndex);
    const newItemHolder = this.generateItemHolder(appdIndex, nextIndex, this.indexDiff + indexDiff, this.props); // eslint-disable-line max-len
    itemHolders.splice(replArrIndex, 1, newItemHolder);
    return this.updateItemHolders(itemHolders, { currIndex: nextIndex });
  }

  requestContainerAnimation(startXPos, endXPos, bounceBack, callback) {
    animate(
      'container__Swipe',
      startXPos,
      endXPos,
      bounceBack ? BOUNCE_BACK_DURATION : SWIPE_TO_DURATION,
      bounceBack ? 'sineOut' : 'easeOutCubic',
      pos => this.applyContainerTransform(pos, 0),
      () => callback && callback(),
    );
  }

  toggleTemplate(open) {
    if (open) {
      if (this.props.template && !this.state.isTemplateOpen) {
        this.setState({ isTemplateOpen: true });
      }
    } else if (this.state.isTemplateOpen) {
      this.setState({ isTemplateOpen: false });
    }
  }

  zoomOutItemHolders() {
    this.setState(prevState => ({
      itemHolders: this.updateItemHolders(prevState.itemHolders, { zoomOut: true }),
    }));
  }


  handleViewChange() {
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    if (this.viewportSize.height !== innerHeight || this.viewportSize.width !== innerWidth) {
      this.viewportSize.width = innerWidth;
      this.viewportSize.height = innerHeight;
      if (this.state.open) {
        this.setState(prevState => ({
          itemHolders: this.updateItemHolders(prevState.itemHolders, this.viewportSize),
        }));
      }
    }
  }

  handleItemTap() {
    if (this.props.template) {
      this.toggleTemplate(!this.state.isTemplateOpen);
    } else {
      // close gallery if it is a minimal gallery
      this.zoomOutItemHolders();
    }
  }

  handleItemDoubleTap() {
    this.toggleTemplate(false);
    if (this.props.onDoubleTap) {
      this.props.onDoubleTap();
    }
  }

  handleItemPan(direction, panDelta) {
    const { items, loop } = this.props;
    const { currIndex } = this.state;
    if (direction === 'lr') {
      if (!loop || items.length < 3) {
        if (
          (panDelta.accX > 0 && this.getItemIndex(currIndex - 1) === undefined) ||
          (panDelta.accX < 0 && this.getItemIndex(currIndex + 1) === undefined)
        ) {
          const xPos = Math.round(this.wrapperXPos + (panDelta.accX * PAN_FRICTION_LEVEL));
          this.applyContainerTransform(xPos, 0);
          return;
        }
      }
      const xPos = this.wrapperXPos + panDelta.accX;
      this.applyContainerTransform(xPos, 0);
    } else if (direction === 'ud') {
      this.toggleTemplate(false);
    }
  }

  handleItemSwipe(direction, delta) {
    const { items, loop, swipeToThreshold } = this.props;
    if (direction === 'Left' || direction === 'Right') {
      if (!loop || items.length < 3) {
        if (
          (direction === 'Right' && this.getItemIndex(this.state.currIndex - 1) === undefined) ||
          (direction === 'Left' && this.getItemIndex(this.state.currIndex + 1) === undefined)
        ) {
          const startXPos = Math.round(this.wrapperXPos + (delta.accX * PAN_FRICTION_LEVEL));
          const endXPos = this.wrapperXPos;
          this.requestContainerAnimation(startXPos, endXPos, true);
          return;
        }
      }
      if (Math.abs(delta.accX) > (swipeToThreshold * this.viewportSize.width)) {
        const startXPos = this.wrapperXPos + delta.accX;
        const isToLeft = direction === 'Left';
        if (isToLeft) this.indexDiff += 1;
        else this.indexDiff -= 1;
        const endXPos = this.wrapperXPos; // Need update this.indexDiff in advance
        this.requestContainerAnimation(startXPos, endXPos, false, () => {
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
            ? this.updateItemHolders(prevState.itemHolders, { currIndex: nextIndex })
            : this.replaceItemHolders(prevState, indexDiff, nextIndex, replIndex, appdIndex);
            return {
              currIndex: nextIndex,
              itemHolders: nextItemHolders,
              loaded: this.loadedItems.indexOf(nextIndex) > -1,
            };
          });
        });
      } else {
        const startXPos = this.wrapperXPos + delta.accX;
        const endXPos = this.wrapperXPos;
        this.requestContainerAnimation(startXPos, endXPos, true);
      }
    }
  }

  handleItemPinchStart() {
    this.toggleTemplate(false);
  }

  handleBeforeItemZoomIn() {
    this.props.beforeZoomIn && this.props.beforeZoomIn();
  }

  handleAfterItemZoomIn() {
    this.toggleTemplate(true);
    this.props.afterZoomIn && this.props.afterZoomIn();
  }

  handleItemLoad(err, itemIndex) {
    if (err) {
      this.setState({});
    }
    if (this.loadedItems.indexOf(itemIndex) === -1) {
      this.loadedItems.push(itemIndex);
    }
    // We load three items at the same time after initItemHolders,
    // but set loaded state true immediately when current item loaded.
    if (itemIndex === this.state.currIndex) {
      this.setState({ loaded: true });
    }
  }

  handleItemReset() {
    this.toggleTemplate(true);
  }

  handleBeforeItemZoomOut() {
    this.toggleTemplate(false);
    this.props.beforeZoomOut && this.props.beforeZoomOut();
  }

  handleAfterItemZoomOut() {
    // There are some situation that mobile trigger `scroll` event and it cannot be canceled.
    // For example, mobile safari will trigger `scroll` event when swipe over the bottom.
    if (this.scrollYOffset) {
      window.scrollTo(0, this.scrollYOffset);
    }
    this.props.afterZoomOut && this.props.afterZoomOut();
    this.props.onClose();
  }

  render() {
    const { items, initIndex, template } = this.props;
    return (
      <Wrapper open={this.state.open}>
        <Overlay innerRef={(node) => { this.overlay = node; }} />
        <Container innerRef={(node) => { this.container = node; }}>
          { initIndex !== undefined && this.state.itemHolders }
        </Container>
        {
          React.isValidElement(template)
          ? React.cloneElement(template, {
            open: this.state.isTemplateOpen,
            items,
            currIndex: this.state.currIndex,
            loaded: this.state.loaded,
            onClose: this.zoomOutItemHolders,
          })
          : template && (
            <UITemplate
              open={this.state.isTemplateOpen}
              items={items}
              currIndex={this.state.currIndex}
              loaded={this.state.loaded}
              onClose={this.zoomOutItemHolders}
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

  initIndex: 0,

  // If true image will be able to swipe from last to first.
  loop: true,

  // If true, render a default ui-template,
  // If false | null | undefined, render a minimal gallery without ui-template,
  // If a react element, render the react element.
  template: true,

  // Default error box template when item cannot be loaded.
  errorBox: <ErrorBox />,

  // in / out animation duration
  showHideDuration: 333,

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
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
    msrc: PropTypes.string,
    src: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  })).isRequired,
  initIndex: PropTypes.number.isRequired,
  sourceElement: isDomElement,
  loop: PropTypes.bool,
  template: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.element,
  ]),
  errorBox: PropTypes.element,
  showHideDuration: PropTypes.number,
  spacing: PropTypes.number,
  swipeToThreshold: PropTypes.number,
  swipeToCloseThreshold: PropTypes.number,
  pinchToCloseThreshold: PropTypes.number,
  maxZoomScale: PropTypes.number,

  onClose: PropTypes.func.isRequired,
  onDoubleTap: PropTypes.func,
  beforeZoomIn: PropTypes.func,
  afterZoomIn: PropTypes.func,
  beforeZoomOut: PropTypes.func,
  afterZoomOut: PropTypes.func,
};
