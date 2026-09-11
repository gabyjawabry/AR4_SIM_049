import React, { useState, useContext, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { FormattedMessage } from "react-intl";
import { PageContext } from "../../../container/js/utilities/context";
import { Button } from 'react-bootstrap';
import { getAnimationAsync } from "../../../container/js/utilities/helper";
import { getAnimation, useIsVisible } from "../../../container/js/utilities/utilities";
import { Col, Row } from 'react-bootstrap';
import AudioWidget from '../../../container/js/audioWidget';
import "../css/toc.scss";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";

import Lottie from "lottie-react";

import ScreenOpenSFX from "../sounds/screen_open.mp3";
import SlideSFX from "../sounds/slide_3.mp3";
import Lock from "../images/lock.svg?react";
import CorrectIcon  from "../images/CorrectIcon.png";
import Shadow from "../images/shadow.svg?react";
import NextBtnArrow from "../images/next_mission.svg?react";

const TOC = (props) => {
  const content = props?.parameters?.content || {};
  const pageContext = useContext(PageContext);
  const slidesData = content.slides || [];
  const [activeSlide, setActiveSlide] = useState(0);
  const {tocState, setAudioURL, stopAudio} = useContext(PageContext);
  const [hasClicked, setHasClicked] = useState([]);
  const [firstLoad, setFirstLoad] = useState(false);
  const OFFSET = 6;
  const controls = useAnimation();
  const lastMissionControls = useAnimation();
  const containerRef = useRef(null);
  const isVisible = useIsVisible(containerRef);
  const [animationsCompleted, setAnimationsCompleted] = useState(false);
  const resultTocState = pageContext.tocState;

  const handleResults = (e) => {
    const swiper = document.querySelector('#container-swiper')?.swiper;
    if (!swiper) return;
    swiper.slideTo(15, 1);
  }
  const handleSlideClick = (slide, index) => {
    setActiveSlide(prev =>
      hasClicked.includes(index) ? prev : prev + 1
    );

    setHasClicked(prev =>
      prev.includes(index) ? prev : [...prev, index]
    );

    const swiper = document.querySelector("#container-swiper")?.swiper;
   swiper.slideTo(OFFSET + (index * 3), 1);

    setAudioURL({
      id: "screenOpen",
      url: ScreenOpenSFX,
      type: "sfx",
    });

    props?.action?.({ slide, index });
  };

  const getTopText = () => {
    return content.mainQuestionArray[activeSlide];
  };

  const renderMedia = (slide, status) => {
    const base = slide.ImageSource;
    return (
      <img src={`images/${base}.png`} alt="slide" className={status} />
    );
  }
  
  const handleTOCAudio = () => {
    const swiper = document.querySelector("#container-swiper")?.swiper;
    const activeSlideId = swiper?.slides?.[swiper.activeIndex]?.getAttribute("id");
    if (activeSlideId === "Main_Slide-6") {
      const answeredSlides = Object.values(tocState || {}).filter(
        (s) => s?.questionAnswers
      ).length;

      setAudioURL({
        id: `toc_audio_${activeSlide}`,
        url: content.mainQuestionAudioArray?.[activeSlide],
        type: `toc_audio_${activeSlide}`,
      });
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    let mounted = true;
    const tocAudioBtn = document.querySelector(".toc-component-container .audio-icon-container button");

    if (!firstLoad) {
      controls.start("animate");
      tocAudioBtn.classList.add('disabled');
      setTimeout(() => setAudioURL({id: "fall1", url: SlideSFX, type: "sfx"}), 1000);
      setTimeout(() => setAudioURL({id: "fall2", url: SlideSFX, type: "sfx"}), 2500);
      setTimeout(() => setAudioURL({id: "fall3", url: SlideSFX, type: "sfx"}, () => {
        tocAudioBtn.classList.remove('disabled');
        handleTOCAudio();
        setAnimationsCompleted(true);
      }), 4000);
      setFirstLoad(true);
    } else {
      handleTOCAudio();
    }

    return () => {
      mounted = false;
    };
  }, [isVisible, tocState]);
     
  const answeredCount = activeSlide || 0;
  const audioData = {
    url: content.mainQuestionAudioArray?.[answeredCount],
    autoplay: true,
    id: `toc_audio_${activeSlide}`,
  };
  
  return (
    <div className="toc-component-container component-container w-100 h-100 d-flex flex-column align-items-center justify-content-center">
       <motion.div className="mainQuestionHolderDiv">
          <motion.div className="mainQuestionHolder" variants={getAnimation("slideDown", 0.6, 0.4)} initial="initial" animate={controls}>
            <Row className="audio-help-container mb-0 mx-0">
              <Col className="d-flex align-items-center justify-content-start col-1 p-0">
                <AudioWidget data={audioData} audioType="main-question" />
              </Col>
            </Row>

            <motion.div className="mainQuestion" dangerouslySetInnerHTML={{ __html: getTopText() }} />
          </motion.div>
        </motion.div>
      <motion.div ref={containerRef} className="toc-container w-100 h-100 d-flex flex-column align-items-center">
        <div className="toc-slides-holder w-100 d-flex flex-row align-items-center justify-content-center"
          style={{ pointerEvents: animationsCompleted ? "auto" : "none",}}>
          {slidesData.map((slide, slideIndex) => {
            const isLocked = slideIndex > answeredCount;
            // const gameResult = resultTocState?.find(item => item.gameId === slide.id );
            // const questionAnswers = gameResult?.questionAnswers ?? [];
            // const allDefined = questionAnswers.length > 0 && questionAnswers.every(answer => answer === 0 || answer === 1);
            // const average = allDefined ? (questionAnswers.reduce((sum, val) => sum + val, 0) / questionAnswers.length) * 100 : null;
            // const slideResultClass =allDefined ? average >= 50   ? "correct"   : "incorrect" : "";

            return (
              <motion.div
                key={slideIndex}
                variants={getAnimation("slideLeft", 0.4, 1 + ((slideIndex * 3) / 2))}
                initial="initial"
                animate={controls}
                className={`toc-slide  d-flex flex-column align-items-center justify-content-end`}
              >
                <div className={`card-wrapper-holder ${activeSlide === slideIndex ? "activated" : hasClicked.includes(slideIndex) ? "missionDone": "" }`}> 
                  <div className="shadow-overlay">
                    <Shadow />
                  </div>

                  <div className={`card-wrapper`}
                    onClick={() => {
                      if (isLocked) return;
                      handleSlideClick(slide, slideIndex);
                    }}
                  >
                    <div className="card-image-holder">
                      {renderMedia(slide, "toc-image")}
                    </div>
                    {isLocked && (
                      <div className="locked-overlay">
                        <Lock />
                      </div>
                    )}

                    <Col className="slide-title text-center pt-2">
                      {slide.title}
                    </Col>
                  </div>
                </div>

                {slideIndex < 2 && (
                  <motion.div className="next-btn-arrow" variants={getAnimation( "slideLeft", 0.4, 1.7 + ((slideIndex * 3) / 2) )} initial="initial" animate={controls}>
                    <NextBtnArrow />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        {activeSlide=== 3 && (
          <motion.div className="toc-button-container" {...getAnimation("expandIn", 0.6, 0)}>
            <Button className='toc-results-button' onClick={handleResults}>
                <FormattedMessage id='toc.results' />
              </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TOC;