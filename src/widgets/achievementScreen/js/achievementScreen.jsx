import { motion, useAnimation } from "framer-motion";
import { useContext, useEffect, useRef,useState } from "react";
import "../css/achievementScreen.scss";
import { FormattedMessage } from "react-intl";
import {getAnimation, useIsVisible} from "../../../container/js/utilities/utilities";
import { getAnimationAsync } from '../../../container/js/utilities/helper.jsx';
import { PageContext } from "../../../container/js/utilities/context";
import ShowAvatarAndName from '../../../container/js/showAvatarAndName.jsx';

import mission1_success from "../images/mission1_success.png";
import mission2_success from "../images/mission2_success.png";
import mission3_success from "../images/mission3_success.png";
import mission1_fail from "../images/mission1_fail.png";
import mission2_fail from "../images/mission2_fail.png";
import mission3_fail from "../images/mission3_fail.png";

const AchievementScreen = ({ parameters }) => {
  const { content } = parameters;
  const pageContext = useContext(PageContext);
  const { setAudioURL, stopAudio, avatarSelected } = pageContext;
  const controls = useAnimation();
  const containerRef = useRef(null);
  const isVisible = useIsVisible(containerRef);
  const missionImages = [ { success: mission1_success, fail: mission1_fail, }, { success: mission2_success, fail: mission2_fail, }, { success: mission3_success, fail: mission3_fail, } ];
  const finalQuestionAnswer = pageContext.tocState?.[content.gameId]?.questionAnswers ?? 0;
  const currentMission = missionImages[content.gameId];
  const gameIndex = content.gameId + 1;
  const [startAnimation, setStartAnimation] = useState(false);
  const [backgroundVideoData, setbackgroundVideoData] = useState(null);
  const backgroundVideoRef = useRef();
  let timer = useRef(null);
  let achievementAudio = "";
  let achievementText = "";
  let achievementImage = "";
  let questionResult="";


  if (finalQuestionAnswer === 0) {
    achievementAudio = content.allFailAudio;
    achievementText = content.notAllCorrectText;
    achievementImage = currentMission?.fail;
    questionResult = "fail";

  } else if (finalQuestionAnswer === 1) {
    achievementAudio = content.onePassAudio;
    achievementText = content.notAllCorrectText;
    achievementImage = currentMission?.fail;
    questionResult = "fail";

  } else if (finalQuestionAnswer === 2) {
    achievementAudio = content.allPassAudio;
    achievementText = content.allCorrectText;
    achievementImage = currentMission?.success;
    questionResult = "win";
  }


  const handleStartAnimations = async () => {
    stopAudio();
    const swiper = document.querySelector("#container-swiper")?.swiper;
    if (swiper) {
      swiper.slideTo(5, 1);
    }
  };


  useEffect(() => {
    async function loadBackgroundVideo() {
      const anim = await getAnimationAsync(`mission${gameIndex}_${avatarSelected}_${questionResult}`);
      setbackgroundVideoData(anim);
    }  
    if (isVisible) { 
      timer.current = setTimeout(() => 
        setAudioURL({ id: "achievement", url: achievementAudio, type: "achievement-screen" })
      , 3000);
      setStartAnimation(true);  
      loadBackgroundVideo();
      controls.start("animate");
    }else{
      controls.start("initial");
    }
    // if (!isVisible) {
    //     controls.start("initial");
    //     return;
    //   }

    //   if (achievementAudio) {
    //     stopAudio();
    //     setAudioURL({id: "achievement", url: achievementAudio, type: "achievement-screen" });
    //   }

    //   controls.start("animate");
  }, [isVisible, achievementAudio, controls]);


  return (

<div className= {`achievementScreen-container p-0 m-0 h-100 w-100  achievementScreen-container_${avatarSelected}_${questionResult}`} >
{/* 
    <div className="achievementScreen-container p-0 m-0 h-100 w-100"> */}
      <div className="achievementScreen-content w-100">
        <motion.div className="avatarAndScore" variants={getAnimation("flipX", 0.6, 0.4)} initial="initial" animate={controls}>
          <ShowAvatarAndName />
          {/* <ShowScoring /> */}
        </motion.div> 
         <motion.div ref={containerRef} className="achievementScreen-container p-0 m-0 h-100 w-100" {...getAnimation("fade", 0.4, 0)} initial="initial" animate={controls}>

         {backgroundVideoData && 
          <video ref={backgroundVideoRef} 
            className="videoSplashScreen" 
            src={backgroundVideoData} 
            poster={new URL(`../../../container/videos/Mission0${gameIndex}_${avatarSelected}_${questionResult}_thumbnail.png`, import.meta.url).href}  
            autoPlay  
            muted  
            playsInline
            loop
          />      
        }
        <motion.div  {...getAnimation("bounceInTop", 0.4, 1)}  className={`lessonTitleHolder ${content.last ? "last" : ""}`}>
          <div className="achievementScreen-content-wrapper">
            <motion.div  {...getAnimation("rotateZoomIn", 0.8, 1)}  className="teamImageMainDiv">
              <img  src={achievementImage}  alt={finalQuestionAnswer === 2 ? "mission_success" : "mission_fail"  }/>
            </motion.div>
            <div className="achievementScreen-content-titles">
              <motion.div  {...getAnimation("expandIn", 0.8, 1)}  className="lessonTitle"  dangerouslySetInnerHTML={{ __html: achievementText,  }}/>
            </div>
            <motion.div className="startLessonBtnHolder" {...getAnimation("scaleIn", 0.4, 1)}>
                <button className="startLessonBtn" onClick={handleStartAnimations}>
                  <FormattedMessage id='feedback.continue' />
                </button>
              </motion.div>
          </div>
        </motion.div>
     

      </motion.div>
    </div>
  </div>
    
  );
};

export default AchievementScreen;
