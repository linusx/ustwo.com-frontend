'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import { get } from 'lodash';
import MediaQuery from 'react-responsive';

import getScrollTrackerMixin from 'app/lib/get-scroll-tracker-mixin';
import getFeaturedImage from 'app/lib/get-featured-image';
import blendColours from 'app/lib/blend-colours';

import ScrollMagic from 'app/adaptors/server/scroll-magic';
import Tracking from 'app/adaptors/server/tracking';
import window from 'app/adaptors/server/window';
import Track from 'app/adaptors/server/track';
import env from 'app/adaptors/server/env';

import DownChevron from 'app/components/down-chevron';
import SVG from 'app/components/svg';
import WordAnimation from 'app/components/word-animation';
import EntranceTransition from 'app/components/entrance-transition';
import Rimage from 'app/components/rimage';
import Hero from 'app/components/hero';
import Video from 'app/components/video';
import BoldHeader from 'app/components/bold-header';
import HomeTextBlock from 'app/components/home-text-block';
import ScreenBlock from 'app/components/screen-block';
import RelatedContent from 'app/components/related-content';

function scrollProgress(component, name) {
  return (e) => {
    let obj = {};
    let key = `scrollProgressBlock${name}`;
    let value = Math.round(e.progress * 100) / 100;
    obj[key] = value;
    component.setState(obj);
  }
}

const PageHome = React.createClass({

  mixins: [getScrollTrackerMixin('home')],

  getInitialState() {
    return {
      chevronLoaded: false,
      scrollProgressBlockHome: 0
    }
  },

  animateChevron(event) {
    if(this.refs.downChevron) {
      this.refs.downChevron.resetAnim();
      this.refs.downChevron.anim();
    }
  },

  setupScrollMagic() {
    const { page } = this.props;
    const blocks = get(page, 'page_builder', []);
    let pageElement = ReactDOM.findDOMNode(this);
    this.Tracking.addPageScrollTracking('home', pageElement);

    if (!env.Modernizr.touchevents && window.innerWidth > 480) {
      let scrollController = this.Tracking.scrollController;
      let blockWelcome = {
        attr: {
          background_colour: {
            value: get(page, 'colors.bg')
          }
        }
      };
      let blockWelcomeDom = ReactDOM.findDOMNode(this.refs.blockWelcome);
      blockWelcomeDom.style.backgroundColor = 'transparent';
      // set initial colour – we need to do this due to having an offset
      pageElement.style.backgroundColor = get(page, 'colors.bg');

      this.scrollSceneChevron = new ScrollMagic.Scene({
          triggerElement: blockWelcomeDom,
          triggerHook: 'onLeave',
          duration: () => { return blockWelcomeDom.clientHeight }
        })
        .on('progress', scrollProgress(this, 'Home'))
        .addTo(scrollController);

      this.colourBlockScenes = [];
      blocks.forEach((block, index) => {
        const blockDom = ReactDOM.findDOMNode(this.refs[`block${index}`]);
        const previousBlock = blocks[index - 1] || blockWelcome;
        blockDom.style.backgroundColor = 'transparent';
        this.colourBlockScenes.push(this.createColourBlockScene(scrollController, pageElement, blockDom, get(previousBlock, 'attr.background_colour.value'), get(block, 'attr.background_colour.value')));
      });
    }
  },

  teardownScrollMagic() {
    this.Tracking.removePageScrollTracking();

    if (!env.Modernizr.touchevents && window.innerWidth > 480) {
      this.scrollSceneChevron.remove();
      this.colourBlockScenes.forEach((scene) => {
        scene.remove();
      });
    }
  },

  createColourBlockScene(scrollController, pageElement, blockReference, hexColour1, hexColour2) {
    return new ScrollMagic.Scene({
        triggerElement: blockReference,
        triggerHook: 'onEnter',
        offset: blockReference.clientHeight * 0.25,
        duration: () => {return blockReference.clientHeight * 0.5}
      })
      .addTo(scrollController)
      .on('progress', (e) => {
        window.requestAnimationFrame(() => {
          pageElement.style.backgroundColor = '#' + blendColours(hexColour1, hexColour2, e.progress);
        });
    });
  },

  componentWillMount() {
    this.Tracking = new Tracking();
  },

  componentDidMount() {
    this.setupScrollMagic();
    this.animTimeout = setTimeout(() => {
      this.animateChevron();
      this.setState({
        chevronLoaded: true
      })
    }, 1500);
  },

  componentWillUnmount() {
    this.teardownScrollMagic();
    clearTimeout(this.animTimeout);
  },

  renderChevron() {
    let Chevron;
    if (window.innerWidth <= 480) {
      return (
        <div className="down-chevron" style={chevronStyles}>
          <svg ref="animsvg" title="Down arrow" role="img" viewBox="0 0 400 200">
            <g>
              <path d="M195.864 143.667c19.556-14.667 39.556-28.89 59.11-43.556 2.224 2.67 6.224 8 8.446 10.67-22.222 16.89-45.778 32.45-67.556 50.67-21.778-17.78-44.89-33.33-67.11-50.22 2.22-2.66 6.22-8 8-11.11 20 14.67 39.555 29.33 59.11 43.56z" />
            </g>
          </svg>
        </div>
      );
    } else {
      // Transition Chevron on scroll
      const chevronStyles = {
        paddingTop: `${30 * this.state.scrollProgressBlockHome}vh`,
        opacity: 1 - this.state.scrollProgressBlockHome * 2
      }

      return (
        <DownChevron
          ref="downChevron"
          onClick={this.onClickDownChevron}
          customClass={this.state.chevronLoaded ? 'loaded' : ''}
          customStyles={chevronStyles}
        />
      );
    }
  },

  render() {
    const { page } = this.props;
    const classes = classnames('page-home', this.props.className);
    const featuredImage = getFeaturedImage(page);

    const logoStyles = {
      opacity: 1 - this.state.scrollProgressBlockHome,
      transform: `translate3d(0, ${30 * this.state.scrollProgressBlockHome}vh, 0)`
    }

    const logo = (
      <EntranceTransition className="logo-entrance">
        <div className="large-logo-wrapper" style={logoStyles}>
          <SVG title="ustwo logo" spritemapID="ustwologo" />
        </div>
      </EntranceTransition>
    );

    const image = getFeaturedImage(page);

    return (
      <article className={classes}>

        <ScreenBlock ref="blockWelcome" customClass="hero" textColour={get(page, 'colors.primary')} bgColour={get(page, 'colors.bg')}>
          <Hero
            title={get(page, 'hero.attr.heading.value')}
            transitionImage={true}
            eventLabel='home-new'
            logo={logo}
            scrollProgress={this.state.scrollProgressBlockHome}
            className="block-wrapper block1"
            ref="blockHome"
          >
            <Video
              src={get(page, 'featured_video')}
              sizes={get(image, 'media_details.sizes')}
              isVideoBackground={true}
              tint={true}
            />
          </Hero>
          {this.renderChevron()}
        </ScreenBlock>

        {this.renderFeatureBlocks()}
        {this.renderRelatedContent()}

      </article>
    );
  },

  renderFeatureBlocks() {
    const { page } = this.props;

    return get(page, 'page_builder').map((block, index) => {
      const blockAttrs = get(block, 'attr');

      return (
        <ScreenBlock key={`block${index}`} ref={`block${index}`} textColour={get(blockAttrs, 'text_colour.value')} bgColour={get(blockAttrs, 'background_colour.value')}>
          <div className="block-parent">
            <div className="block-child">
              <MediaQuery maxWidth={480}>
                <Rimage wrap="div" className="image-container" sizes={get(blockAttrs, 'image_jpg.value.0.sizes')} />
              </MediaQuery>
              <MediaQuery minWidth={481}>
                <Rimage wrap="div" className="image-container" sizes={get(blockAttrs, 'image_png.value.0.sizes')} />
              </MediaQuery>
            </div>
          </div>
          <div className="text-block">
            <HomeTextBlock title={get(blockAttrs, 'heading.value')} colour={get(blockAttrs, 'text_colour.value')}>
              {get(block, 'attr.description.value')}
            </HomeTextBlock>
          </div>
        </ScreenBlock>
      );
    });
  },

  renderRelatedContent() {
    let relatedContent;

    if(this.props.relatedContent.length) {
      relatedContent = <RelatedContent content={this.props.relatedContent} />
    }
    return relatedContent;
  },

  onClickDownChevron() {
    Track('send', {
      'hitType': 'event',
      'eventCategory': 'hub_page',
      'eventAction': 'click_animated_chevron',
      'eventLabel': 'home'
    });
  }
});

export default PageHome;
