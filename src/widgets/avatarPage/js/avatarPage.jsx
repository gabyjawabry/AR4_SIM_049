import React, { useState, useEffect, useRef, useContext} from "react";
import { FormattedMessage } from "react-intl";
import { motion, useAnimation } from "framer-motion";
import { PageContext } from "../../../container/js/utilities/context";
import { getAnimation , useIsVisible, saveWidgetState} from "../../../container/js/utilities/utilities";
import { Button } from "react-bootstrap";
import { getAnimationAsync } from '../../../container/js/utilities/helper.jsx';
import "../css/avatarPage.scss";

const avatarPage = (props) => {
  const content = props?.parameters?.content || {};
  const { mainQuestion, mainQuestionAudio } = content;
  const pageContext = useContext(PageContext);
  const { setAudioURL, avatarSelected, stopAudio } = pageContext;
  const containerRef = useRef(null);
  const [animationsCompleted, setAnimationsCompleted] = useState(false);
  const controls = useAnimation();
  const isVisible = useIsVisible(containerRef);

  const handleNextScreen = () => {
    stopAudio();
    const swiper = document.querySelector('#container-swiper')?.swiper;
    if (swiper) swiper.slideTo(5, 1);
  };

  useEffect(() => {
    if (isVisible) {      
      controls.start("animate");
      setAudioURL({id: "avatar", url: content.mainQuestionAudio, type: "selected-avatar"});
      // const swiper = document.querySelector('#container-swiper')?.swiper;
      // saveWidgetState(pageContext, "slider", { currentSlide: swiper.activeIndex }, true);
    }else{
      controls.start("initial");
    }
  }, [isVisible]);

  return (
    <div className="ap-component-container component-container w-100 h-100 d-flex flex-column align-items-center justify-content-center">
        <motion.div ref={containerRef} className="mainShowAvatarHolder d-flex flex-column" variants={getAnimation("slideDown", 0.8, 0)} initial="initial" animate={controls}>
          <div className="showAvatarHolder">
            {avatarSelected && (
              <div className="avatarImageHolder">
                <img src={`./images/good_choice_${avatarSelected}.png`} alt="Selected Avatar" className="selected-avatar-image" />
              </div>
            )}
            <span className="showAvatarHolderText" dangerouslySetInnerHTML={{ __html: mainQuestion }} />
            <div className="next-screen-btn-holder  w-100 h-100 d-flex flex-column align-items-center justify-content-center">
              <Button type="button" className="next-screen-btn" onClick={handleNextScreen}>
                <FormattedMessage id='feedback.continue' /> 
              </Button>
            </div>
          </div>
        </motion.div>
    </div>
  );
};

export default avatarPage;