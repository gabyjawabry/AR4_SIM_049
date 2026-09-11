import { motion, useAnimation } from "framer-motion";
import { useContext, useEffect, useState, useRef } from "react";
import "../css/resultsScreen.scss";
import {getAnimation,useIsVisible,getAppState,saveAppState} from "../../../container/js/utilities/utilities";
import { PageContext } from "../../../container/js/utilities/context";
import Replay from "../../../container/images/icons/replay.svg?react";
import { useEventSender } from "../../../container/js/utilities/logging";
import mission1_success from "../images/mission1_success.png";
import mission2_success from "../images/mission2_success.png";
import mission3_success from "../images/mission3_success.png";
import mission1_fail from "../images/mission1_fail.png";
import mission2_fail from "../images/mission2_fail.png";
import mission3_fail from "../images/mission3_fail.png";

const ResultsScreen = ({ parameters }) => {
  const { content } = parameters;
  const controls = useAnimation();
  const pageContext = useContext(PageContext);
  const { tocState, setAudioURL, stopAudio, simulationStartTime} = pageContext;
  const containerRef = useRef(null);
  const isVisible = useIsVisible(containerRef);
  const [showReplay, setShowReplay] = useState(false);
  const sendEvent = useEventSender();
  const missionImages = [
    {
      success: mission1_success,
      fail: mission1_fail,
    },
    {
      success: mission2_success,
      fail: mission2_fail,
    },
    {
      success: mission3_success,
      fail: mission3_fail,
    },
  ];

  const missionResults = missionImages.map((mission, index) => {
    const answer =tocState?.[index]?.questionAnswers ?? 0;
    return { index, answer, image:   answer === 2 ? mission.success : mission.fail,};
  });
  const allMissionsCorrect = missionResults.every(
    (mission) => mission.answer === 2
  );
  const achievementText = allMissionsCorrect ? content.allCorrectText : content.notAllCorrectText;
  const achievementAudio = allMissionsCorrect ? content.allPassAudio : content.allFailAudio;
  const handleReplay = () => {
    window.location.reload();
  };
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    controls.start("animate");

    if (achievementAudio) {
      stopAudio();
      setAudioURL({
        id: "achievement",
        url: achievementAudio,
        type: "achievement-screen",
      });
    }
    const logEvent = {
      timeSpent: {
        activeTime: simulationStartTime.current,
        idleTime: Date.now() - simulationStartTime.current,
        totalTime: Date.now(),
      },
    };

    sendEvent("simulation-finished", logEvent);
    const savedState = getAppState(pageContext);

    if (savedState?.status === "IN_PROGRESS") {
      saveAppState(pageContext,
        {
          status: "COMPLETED",
        },
        true
      );

      sendEvent("navigation-visibility-event", {
        name: "navigation-visibility-event",
        show: true,
        occurredOn: Date.now(),
      });
    }
  }, [
    isVisible,
    achievementAudio,
  ]);

  return (
    <div className="component-container w-100">
      <motion.div ref={containerRef} className="resultsScreen-container p-0 m-0 h-100 w-100" variants={getAnimation("blurIn", 0.8, 0)} initial="initial" animate={controls}>
        <div className="resultsScreen-content w-100">
          <motion.div {...getAnimation("bounceInTop", 0.4, 1)} className={`lessonTitleHolder ${   content.last ? "last" : "" }`}>
            <div className="result-content-wrapper">
              <div className="missions-results">
                {missionResults.map((mission) => (
                  <motion.div key={mission.index} {...getAnimation( "rotateZoomIn", 0.8, mission.index * 0.2 )} className="teamImageMainDiv">
                    <img src={mission.image} alt={   mission.answer === 2     ? `mission_${mission.index + 1}_success`     : `mission_${mission.index + 1}_fail` }/>
                  </motion.div>
                ))}
              </div>
              <div className="result-content-titles">
                <motion.div  {...getAnimation( "expandIn", 0.8, 1)}  className="lessonTitle"  dangerouslySetInnerHTML={{ __html: achievementText,  }}/>
              </div>
            </div>
          </motion.div>
          <motion.div {...getAnimation("expandIn", 0.5, 0)}>
            <button className="replay-btn"  onClick={handleReplay}>
              <Replay />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultsScreen;