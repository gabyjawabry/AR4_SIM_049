import { motion, useAnimation, useScroll } from "framer-motion";
import {  useContext, useEffect, useState, useRef } from 'react';
import { FormattedMessage } from "react-intl";
import '../css/splashScreen.scss';
import { getAnimation, useIsVisible } from "../../../container/js/utilities/utilities";
import { PageContext } from "../../../container/js/utilities/context";
import { getAnimationAsync } from '../../../container/js/utilities/helper.jsx';
import ShowAvatarAndName from '../../../container/js/showAvatarAndName.jsx';

const SplashScreen = ({parameters}) => {
  const { content } = parameters;
  const controls = useAnimation();
  const containerRef = useRef(null);
  const isVisible = useIsVisible(containerRef);
  const { setAudioURL, stopAudio, avatarSelected, userName, studentGrade } = useContext(PageContext);
  const [startAnimation, setStartAnimation] = useState(false);
  const [backgroundVideoData, setbackgroundVideoData] = useState(null);
  const videoPlayerRef = useRef();
  const backgroundVideoRef = useRef();
  let timer = useRef(null);
  const thumbnails = import.meta.glob(
  "../../../container/videos/*_thumbnail.png",
  {
    eager: true,
    import: "default",
    query: "?url",
  }
);
  const handleStartAnimations = () => {
      stopAudio();
      clearTimeout(timer.current);
      const swiper = document.querySelector('#container-swiper')?.swiper;
      if (swiper) swiper.slideNext(1);
  };

  useEffect(() => {
    async function loadBackgroundVideo() {
      const anim = await getAnimationAsync(`mission${content.splashIndex}_splashScreen`);
      setbackgroundVideoData(anim);
    }  

    if (isVisible) { 
      timer.current = setTimeout(() => 
        setAudioURL({ id: "splash", url: content.mainQuestionAudio, type: "splash-screen" })
      , 3000);
      setStartAnimation(true);  
      loadBackgroundVideo();
      controls.start("animate");
    }else{
      controls.start("initial");
    }
  }, [isVisible]);
  const thumbnailName = `Mission0${content.splashIndex}_splashScreen_thumbnail.png`;
  const thumbnail = Object.entries(thumbnails).find(
    ([path]) => path.endsWith(thumbnailName)
  )?.[1];
  return (
    <div className="splashScreen-container p-0 m-0 h-100 w-100" 
      style={{
      backgroundImage: thumbnail ? `url("${thumbnail}")` : "none",
    }}>
      <div className="splashScreen-content w-100">
        <motion.div className="avatarAndScore" variants={getAnimation("flipX", 0.6, 0.4)} initial="initial" animate={controls}>
          <ShowAvatarAndName />
          {/* <ShowScoring /> */}
        </motion.div> 
        <motion.div ref={containerRef}  className="lessonTitleHolder"   variants={getAnimation("bounceInTop", 0.4, 1)} initial="initial" animate={controls}>
          <div className="splashScreen-content-wrapper">
            <div className="splashScreen-content-titles">
              <motion.div {...getAnimation("expandIn", 0.8, 1)} className="lessonTitle" dangerouslySetInnerHTML={{ __html: content.lessonTitle }}/>
              {content.lessonSubTitle && (
                <motion.div {...getAnimation("bounce", 0.8, 1)} className="lessonSubTitle"  dangerouslySetInnerHTML={{ __html: content.lessonSubTitle }} />
              )}
            </div>
            <motion.div  className="startLessonBtnHolder"  {...getAnimation("scaleIn", 0.4, 1)}>
              <button className="startLessonBtn" onClick={handleStartAnimations}>
                <FormattedMessage id='splashScreen.start' /> 
              </button>
            </motion.div>
          </div>
        </motion.div>
        {backgroundVideoData && 
          <video ref={backgroundVideoRef} 
            className="videoSplashScreen" 
            src={backgroundVideoData} 
            poster={new URL(`../../../container/videos/Mission0${content.splashIndex}_splashScreen_thumbnail.png`, import.meta.url).href}  
            autoPlay  
            muted  
            playsInline
            loop
          />      
        }
      </div>
    </div>
  );
};

export default SplashScreen;
