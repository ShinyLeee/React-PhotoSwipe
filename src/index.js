import React, { Component, PropTypes } from 'react';
import ItemHolder from './components/itemHolder';
import UITemplate from './components/ui-template';
import {
  Wrapper,
  Overlay,
  Container,
} from './styled';
import { on, off } from './utils';
import {
  PAN_FRICTION_LEVEL,
  SWIPE_TO_DURATION,
  BOUNCE_BACK_DURATION,
} from './utils/constant';
import startAnimation from './utils/animation';

export default class PhotoSwipe extends Component {

  constructor(props) {
    super(props);
    this.indexDiff = 0;
    this.state = {
      open: false,
      currIndex: props.initIndex,
      viewportX: window.innerWidth,
      viewportY: window.innerHeight,
      itemHolders: undefined,
      isPanning: false,
      isTemplateOpen: props.template ? true : undefined,
    };
    this.viewChangeHandler = this.checkViewport.bind(this);
    this.handleInnerClose = this.handleInnerClose.bind(this);
    this.handleItemTap = this.handleItemTap.bind(this);
    this.handleItemPanStart = this.handleItemPanStart.bind(this);
    this.handleItemPan = this.handleItemPan.bind(this);
    this.handleItemSwipe = this.handleItemSwipe.bind(this);
    this.handleItemPinchEnd = this.handleItemPinchEnd.bind(this);
  }

  componentDidMount() {
    on(window, 'scroll resize orientationchange', this.viewChangeHandler);
  }

  componentWillReceiveProps(nextProps) {
    const { open } = this.props;
    if (nextProps.open !== open) {
      this.setState(prevState => ({
        open: nextProps.open,
        currIndex: nextProps.open ? nextProps.initIndex : prevState.currIndex,
        itemHolders: nextProps.open ? this.initItemHolders(nextProps) : prevState.itemHolders,
      }));
    }
  }

  componentWillUnmount() {
    off(window, 'scroll resize orientationchange', this.viewChangeHandler);
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
    return -Math.round(this.indexDiff * this.state.viewportX * (1 + this.props.spacing));
  }

  initItemHolders(nextProps) {
    const { initIndex, items, ...other } = nextProps;
    const { viewportX, viewportY } = this.state;
    const prevIndex = this.getItemIndex(initIndex - 1, nextProps);
    const nextIndex = this.getItemIndex(initIndex + 1, nextProps);
    return [
      prevIndex !== undefined ? <ItemHolder
        key={items[prevIndex].id}
        itemIndex={prevIndex}
        indexDiff={-1}
        item={items[prevIndex]}
        viewportSize={{ width: viewportX, height: viewportY }}
        onTap={this.handleItemTap}
        onPanStart={this.handleItemPanStart}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onPinch={this.handleItemPinchEnd}
        {...other}
      /> : <div key="prevItemPlaceHolder" />,
      <ItemHolder
        key={items[initIndex].id}
        item={items[initIndex]}
        itemIndex={initIndex}
        indexDiff={0}
        viewportSize={{ width: viewportX, height: viewportY }}
        onTap={this.handleItemTap}
        onPanStart={this.handleItemPanStart}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onPinch={this.handleItemPinchEnd}
        {...other}
      />,
      nextIndex !== undefined ? <ItemHolder
        key={items[nextIndex].id}
        item={items[nextIndex]}
        itemIndex={nextIndex}
        indexDiff={1}
        viewportSize={{ width: viewportX, height: viewportY }}
        onTap={this.handleItemTap}
        onPanStart={this.handleItemPanStart}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onPinch={this.handleItemPinchEnd}
        {...other}
      /> : <div key="nextItemPlaceHolder" />,
    ];
  }

  /**
   *
   * @param {Object} prevState - previous react state object
   * @param {Number} indexDiff - swipe to left / next(1) or right / prev(-1)
   * @param {Number} replIndex - The item index that wait to be replaced
   * @param {Number} appdIndex  - The item index that wait to be appended
   *
   * @return {Object} newItemHolders - An updatedItemHolders react component object
   */
  updateItemHolders(prevState, indexDiff, replIndex, appdIndex) {
    const { items, loop, ...other } = this.props;
    const { viewportX, viewportY, itemHolders } = prevState;
    const newItemHolders = [...itemHolders];

    const replArrIndex = itemHolders.map(item => item.props.itemIndex).indexOf(replIndex);


    const newItemHolder = appdIndex === undefined
    ? <div key={indexDiff > 0 ? 'nextItemPlaceHolder' : 'prevItemPlaceHolder'} />
    : (
      <ItemHolder
        key={items[appdIndex].id}
        item={items[appdIndex]}
        itemIndex={appdIndex}
        indexDiff={indexDiff > 0 ? this.indexDiff + 1 : this.indexDiff - 1}
        viewportSize={{ width: viewportX, height: viewportY }}
        onTap={this.handleItemTap}
        onPanStart={this.handleItemPanStart}
        onPan={this.handleItemPan}
        onSwipe={this.handleItemSwipe}
        onPinch={this.handleItemPinchEnd}
        {...other}
      />
    );
    newItemHolders.splice(replArrIndex, 1, newItemHolder);
    return newItemHolders;
  }

  checkViewport() {
    const { viewportX, viewportY } = this.state;
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    if (viewportY !== innerHeight || viewportX !== innerWidth) {
      // console.log(`x: ${innerWidth}`, `y: ${innerHeight}`);
      this.setState({
        viewportX: innerWidth,
        viewportY: innerHeight,
      });
    }
  }

  applyItemWrapperTransform(x, y) {
    this.itemWrapper.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
  }

  handleInnerClose() {
    this.indexDiff = 0;
    this.setState({ open: false });
    this.applyItemWrapperTransform(0, 0);
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

  handleItemPanStart() {
    this.setState({ isPanning: true });
  }

  /**
   *
   * @param {String} direction - pan direction `lr` or `ud`
   * @param {Object} panDelta  - contain `x`, 'y' and accumulated `accX`, `accY`
   * @param {Object} itemDimension - item display `width`, `height`
   */
  handleItemPan(direction, panDelta, itemDimension) {
    const { items, loop } = this.props;
    const { currIndex } = this.state;
    if (direction === 'lr') {
      // Restirct pan moving speed
      if (!loop || items.length < 3) {
        if (
          (panDelta.accX > 0 && this.getItemIndex(currIndex - 1) === undefined) ||
          (panDelta.accX < 0 && this.getItemIndex(currIndex + 1) === undefined)
        ) {
          const xPos = this.wrapperXPos + (panDelta.accX * PAN_FRICTION_LEVEL);
          this.applyItemWrapperTransform(xPos, 0);
          return;
        }
      }
      const xPos = this.wrapperXPos + panDelta.accX;
      this.applyItemWrapperTransform(xPos, 0);
    } else if (direction === 'ud') {
      const absAccY = Math.abs(panDelta.accY);
      const opacity = 1 - (absAccY / itemDimension.height);
      this.background.style.opacity = opacity;
      if (absAccY > 0) {
        this.setState({ isTemplateOpen: false });
      }
    }
  }

  /**
   *
   * @param {String} direction - swipe direction `lr` or `ud`
   * @param {Object} swipeDelta  - accumulated `accX`, `accY`
   * @param {Object} itemDimension - item display `width`, `height`
   */
  handleItemSwipe(direction, swipeDelta, itemDimension) {
    const {
      items,
      loop,
      swipeToThreshold,
      swipeToCloseThreshold,
    } = this.props;
    const { currIndex } = this.state;
    // TODO should we move this into onPanEnd?
    this.setState({ isPanning: false });
    if (direction === 'Left' || direction === 'Right') {
      if (Math.abs(swipeDelta.accX) > swipeToThreshold * itemDimension.width) {
        if (!loop || items.length < 3) {
          if (
            (direction === 'Right' && this.getItemIndex(currIndex - 1) === undefined) ||
            (direction === 'Left' && this.getItemIndex(currIndex + 1) === undefined)
          ) {
            const sPos = this.wrapperXPos + (swipeDelta.accX * PAN_FRICTION_LEVEL);
            const ePos = this.wrapperXPos;
            startAnimation(sPos, ePos, SWIPE_TO_DURATION, 'easeOutCubic', (pos) => {
              this.applyItemWrapperTransform(pos, 0);
            });
            return;
          }
        }

        const isToLeft = direction === 'Left';
        const sPos = this.wrapperXPos + swipeDelta.accX;
        if (isToLeft) this.indexDiff += 1;
        else this.indexDiff -= 1;
        const ePos = this.wrapperXPos; // Need update this.indexDiff in advance
        startAnimation(
          sPos,
          ePos,
          SWIPE_TO_DURATION,
          'easeOutCubic',
          pos => this.applyItemWrapperTransform(pos, 0),
          () => {
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
                                      : this.updateItemHolders(prevState, indexDiff, replIndex, appdIndex); // eslint-disable-line max-len
              return {
                currIndex: nextIndex,
                itemHolders: nextItemHolders,
              };
            });
          },
        );
      } else {
        const sPos = this.wrapperXPos + swipeDelta.accX;
        const ePos = this.wrapperXPos;
        startAnimation(sPos, ePos, BOUNCE_BACK_DURATION, 'easeOutCubic', (pos) => {
          this.applyItemWrapperTransform(pos, 0);
        });
      }
    } else if (direction === 'Up' || direction === 'Down') {
      if (Math.abs(swipeDelta.accY) > swipeToCloseThreshold * itemDimension.height) {
        this.handleInnerClose();
      }
      this.background.style.opacity = 1;
      this.setState({ isTemplateOpen: true });
    }
  }

  handleItemPinchEnd(e) {
    const { pinchToCloseThresholder } = this.props;
    if (e.scale < pinchToCloseThresholder) {
      this.handleInnerClose();
    }
  }

  render() {
    const {
      initIndex,
      items,
      template,
    } = this.props;
    return (
      <Wrapper open={this.state.open}>
        <Overlay
          open={this.state.open}
          isPanning={this.state.isPanning}
          innerRef={(node) => { this.background = node; }}
        />
        <Container innerRef={(node) => { this.itemWrapper = node; }}>
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

  showAnimateDuration: 375,
  hideAnimateDuration: 375,

  // Spacing ratio between slides.
  // For example, 0.12 will render as a 12% of sliding viewport width.
  spacing: 0.12,

  // Maximum swipe distance based on percentage of item width,
  // exceed it swipe left or right will swipe to next or prev image.
  swipeToThreshold: 0.4,

  // Maximum swipe distance based on percentage of item height,
  // exceed it swipe down or up will swipe to close gallery.
  swipeToCloseThreshold: 0.4,

  // Minimum pinch scale based on percentage of original item
  // below it when pinchEnd will close gallery.
  // Set zero pinch will never close gallery.
  pinchToCloseThresholder: 0.4,

  // Maximum zoom level when performing zoom gesture
  maxZoomLevel: 2,
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
  pinchToCloseThresholder: PropTypes.number,
  maxZoomLevel: PropTypes.number,
  onInnerClose: PropTypes.func.isRequired,
};
