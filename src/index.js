import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ItemHolder from './components/itemHolder';
import UITemplate from './components/ui-template';
import ErrorBox from './components/errorBox';
import { Wrapper, Overlay, Container } from './styled';
import { getScrollY, isDomElement } from './utils';
import { on, off } from './utils/event';
import {
  PAN_FRICTION_LEVEL,
  SWIPE_TO_DURATION,
  BOUNCE_BACK_DURATION,
  DIRECTION_HORZ,
  DIRECTION_VERT,
  DIRECTION_LEFT,
  DIRECTION_RIGHT,
} from './utils/constant';
import { animate } from './utils/animation';

export default class PhotoSwipe extends Component {
  constructor(props) {
    super(props);
    this.indexDiff = 0;
    this.scrollYOffset = null;
    this.viewportSize = { width: window.innerWidth, height: window.innerHeight };
    this.loadedItems = [];
    this.state = {
      open: false,
      currIndex: props.initIndex,
      itemHolders: undefined,
      loaded: false,
      isTemplateOpen: false,
    };
    this.closeItemHolders = this.closeItemHolders.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
    this.handleItemTap = this.handleItemTap.bind(this);
    this.handleItemDoubleTap = this.handleItemDoubleTap.bind(this);
    this.handleItemPanStart = this.handleItemPanStart.bind(this);
    this.handleItemPan = this.handleItemPan.bind(this);
    this.handleItemPanEnd = this.handleItemPanEnd.bind(this);
    this.handleItemPinchStart = this.handleItemPinchStart.bind(this);
    this.handleItemPinchEnd = this.handleItemPinchEnd.bind(this);
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
        : this.updateItemHolders(prevState.itemHolders, { open: false, closing: false }),
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
        onPanStart={this.handleItemPanStart}
        onPan={this.handleItemPan}
        onPanEnd={this.handleItemPanEnd}
        onPinchStart={this.handleItemPinchStart}
        onPinchEnd={this.handleItemPinchEnd}
        onItemLoad={this.handleItemLoad}
        afterReset={this.handleItemReset}
        beforeZoomIn={this.handleBeforeItemZoomIn}
        afterZoomIn={this.handleAfterItemZoomIn}
        beforeZoomOut={this.handleBeforeItemZoomOut}
        afterZoomOut={this.handleAfterItemZoomOut}
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

  closeItemHolders() {
    this.setState(prevState => ({
      itemHolders: this.updateItemHolders(prevState.itemHolders, { closing: true }),
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

  handleItemTap(e, isZoom) {
    if (this.props.onTap) {
      this.props.onTap(e, isZoom);
    } else if (this.props.template) {
      this.toggleTemplate(!this.state.isTemplateOpen);
    } else {
      // close gallery if it is a minimal gallery
      this.closeItemHolders();
    }
  }

  handleItemDoubleTap(e, isZoom) {
    if (this.props.onDoubleTap) {
      this.props.onDoubleTap(e, isZoom);
    } else {
      this.toggleTemplate(false);
    }
  }

  handleItemPanStart(e, isZoom) {
    if (this.props.onPanStart) {
      this.props.onPanStart(e, isZoom);
    } else if (!isZoom && e.direction === DIRECTION_VERT) {
      this.toggleTemplate(false);
    }
  }

  handleItemPan({ direction, delta }) {
    const { items, loop } = this.props;
    const { currIndex } = this.state;
    if (direction === DIRECTION_HORZ) {
      if (!loop || items.length < 3) {
        if (
          (delta.accX > 0 && this.getItemIndex(currIndex - 1) === undefined) ||
          (delta.accX < 0 && this.getItemIndex(currIndex + 1) === undefined)
        ) {
          const xPos = Math.round(this.wrapperXPos + (delta.accX * PAN_FRICTION_LEVEL));
          this.applyContainerTransform(xPos, 0);
          return;
        }
      }
      const xPos = this.wrapperXPos + delta.accX;
      this.applyContainerTransform(xPos, 0);
    }
  }

  handleItemPanEnd(e, isZoom) {
    const { direction, delta, velocity } = e;
    const { items, loop, swipeVelocity } = this.props;
    if (!isZoom && (direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT)) {
      if (!loop || items.length < 3) {
        if (
          (direction === DIRECTION_RIGHT && this.getItemIndex(this.state.currIndex - 1) === undefined) ||
          (direction === DIRECTION_LEFT && this.getItemIndex(this.state.currIndex + 1) === undefined)
        ) {
          const startXPos = Math.round(this.wrapperXPos + (delta.accX * PAN_FRICTION_LEVEL));
          const endXPos = this.wrapperXPos;
          this.requestContainerAnimation(startXPos, endXPos, true);
          return;
        }
      }
      if ((velocity > swipeVelocity) || (Math.abs(delta.accX) > this.viewportSize.width * 0.5)) {
        const startXPos = this.wrapperXPos + delta.accX;
        const isToLeft = direction === DIRECTION_LEFT;
        if (isToLeft) this.indexDiff += 1;
        else this.indexDiff -= 1;
        const endXPos = this.wrapperXPos; // Need update this.indexDiff in advance
        this.props.beforeChange && this.props.beforeChange(this.state.currIndex);
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
          }, () => this.props.afterChange && this.props.afterChange(this.state.currIndex));
        });
      } else {
        const startXPos = this.wrapperXPos + delta.accX;
        const endXPos = this.wrapperXPos;
        this.requestContainerAnimation(startXPos, endXPos, true);
      }
    }
    this.props.onPanEnd && this.props.onPanEnd(e, isZoom);
  }

  handleItemPinchStart(e, isZoom) {
    if (this.props.onPinchStart) {
      this.props.onPinchStart(e, isZoom);
    } else {
      this.toggleTemplate(false);
    }
  }

  handleItemPinchEnd(e, isZoom) {
    this.props.onPinchEnd && this.props.onPinchEnd(e, isZoom);
  }

  handleItemLoad(itemIndex) {
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

  handleBeforeItemZoomIn(isFirstTime) {
    if (this.props.beforeZoomIn) {
      this.props.beforeZoomIn(isFirstTime);
    }
  }

  handleAfterItemZoomIn(isFirstTime) {
    if (this.props.afterZoomIn) {
      this.props.afterZoomIn(isFirstTime);
    } else {
      this.toggleTemplate(true);
    }
  }

  handleBeforeItemZoomOut() {
    if (this.props.beforeZoomOut) {
      this.props.beforeZoomOut();
    } else {
      this.toggleTemplate(false);
    }
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
            onClose: this.closeItemHolders,
          })
          : template && (
            <UITemplate
              open={this.state.isTemplateOpen}
              items={items}
              currIndex={this.state.currIndex}
              loaded={this.state.loaded}
              onClose={this.closeItemHolders}
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

  // In / out animation duration
  showHideDuration: 333,

  // Spacing ratio between slides,
  // For example, 0.12 will render as a 12% of sliding viewport width.
  spacing: 0.12,

  // Minimal velocity that treat panEnd to swipe,
  // For example, exceeding 0.3 will swipe to next item or close gallery.
  swipeVelocity: 0.3,

  // Minimum pinch scale based on percentage of original item,
  // below it when pinchEnd will close gallery,
  // For example, 0 will never close gallery.
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
  swipeVelocity: PropTypes.number,
  pinchToCloseThreshold: PropTypes.number,
  maxZoomScale: PropTypes.number,

  onClose: PropTypes.func.isRequired,
  onTap: PropTypes.func,
  onDoubleTap: PropTypes.func,
  onPanStart: PropTypes.func,
  onPanEnd: PropTypes.func,
  onPinchStart: PropTypes.func,
  onPinchEnd: PropTypes.func,
  beforeChange: PropTypes.func,
  afterChange: PropTypes.func,
  beforeZoomIn: PropTypes.func,
  afterZoomIn: PropTypes.func,
  beforeZoomOut: PropTypes.func,
  afterZoomOut: PropTypes.func,
};
