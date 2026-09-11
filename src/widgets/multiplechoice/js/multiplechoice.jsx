import { useState, useEffect, useRef, useContext } from 'react';
import "../css/multipleChoice.scss";
import { motion, useAnimation } from "framer-motion";
import Feedback from "../../../container/js/feedback";
import { getAnimation, ShowCorrectStars, shuffle, chooseUniqueItems, useIsVisible } from "../../../container/js/utilities/utilities";
import { Col, Row } from 'react-bootstrap';
import AudioWidget from '../../../container/js/audioWidget';
import { PageContext } from "../../../container/js/utilities/context";
import CheckRounded from "../../../container/images/icons/check.svg?react";
import CorrectStars from "../../../container/images/correct-stars.svg?react";
import GoToTOCButton from '../../../container/js/showTOCBtn.jsx';
import HintButton from '../../../container/js/hintButton.jsx';
import ShowAvatarAndName from '../../../container/js/showAvatarAndName.jsx';
import VideoPlayer from "../../videoPlayer/js/videoPlayer.jsx";
import ButtonClickSFX from "../sounds/button_click.mp3";
import { getAnimationAsync } from '../../../container/js/utilities/helper.jsx';
import CorrectSFX from '../sounds/gauge_correct.mp3';
import IncorrectSFX from '../sounds/gauge_incorrect.mp3';
import { FormattedMessage } from "react-intl";
const MultipleChoice = (props) => {
  const pageContext = useContext(PageContext);
  const parameters = props.parameters || {};
  const content = parameters?.content || {};
  const containerRef = useRef(null);
  const [hintData, setHintData] = useState('');
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [feedbackParams, setFeedbackParams] = useState(null);
  const [submitCount, setSubmitCount] = useState(0);
  const feedbackSubmitButtonRef = useRef();
  const [mcOptions, setMcOptions] = useState([]);
  const correctOption = mcOptions.find(o => o.correct);
  const controls = useAnimation();
  const isVisible = useIsVisible(containerRef);
  const [currentRound, setCurrentRound] = useState(0);
  const roundData = content.rounds?.[currentRound] || {};
  const [questionGrade, setQuestionGrade] = useState(0);
  const feedbackVideoRef = useRef();
  const [backgroundVideoData, setBackgroundVideoData] = useState(null);
  const backgroundVideoRef = useRef();
  const { setAudioURL, stopAudio, avatarSelected } = useContext(PageContext);
  const [withExplanationScreen, setWithExplanationScreen] = useState(content.withExplanationScreen || false);
  const startTime = useRef(null);
  // const [videoState, setVideoState] = useState("cover");
  const gameIndex = content.gameId + 1;
  const [questionAnswers, setQuestionAnswers] = useState(
    () =>
      (content.rounds || []).map((_, index) => ({
        gameId: content.gameId,
        round: index + 1,
        answer: null,
      }))
  );
  async function loadBackgroundVideo() {  
   const anim = await getAnimationAsync(`mission${gameIndex}_${avatarSelected}_question${currentRound + 1}`);
    setBackgroundVideoData(anim);
  }
  const audioData = {
    url: content.mainQuestionAudio,
    autoplay: true,
    id: parameters.id || 0
  };

  useEffect(() => {
    if (!roundData) return;

  const mcCorrectOptions = roundData.correctAnswersArray.map(item => ({
    text: item.text,
    correct: true,
  }));

  const mcWrongOptions = roundData.wrongAnswersArray.map(item => ({
    text: item.text,
    correct: false,
  }));

  const result = shuffle([...mcCorrectOptions, ...mcWrongOptions]).map((item, idx) => ({
    id: idx + 1,
    text: item.text,
    correct: item.correct,
  }));
    setMcOptions(result);
    setSelected(null);
    setSubmitted(false);
    setChecked(false);
    setFeedbackParams({});   
  }, [currentRound]);

  useEffect(() => {
      setSubmitCount(0);
      setFeedbackParams({});
  }, [0]);  

  const goToNextRound = () => {
    const isLastRound =currentRound === content.rounds.length - 1; 
    stopAudio();
    if (!isLastRound) {
      setCurrentRound(prev => prev + 1);  
      setSelected(null);
      setSubmitted(false);
      setChecked(false);
      setFeedbackParams({});
    } else {
      const swiper = document.querySelector("#container-swiper") ?.swiper; 
      if (swiper) swiper.slideNext(1);
    }
  };

  const checkAnswers = (type) => {
    let feedbackData = {};
    if (type === "tryagain") {
      setSelected(null);
      setSubmitted(false);
      setChecked(false);
      setFeedbackParams({});
      return;
    } 
    if (type === "reset") {
      setSelected(null);
      setSubmitted(false);
      setChecked(false);
      setFeedbackParams({});
      return;
    }
    setChecked(true);
    if (selected === null) return;
    const isCorrect = selected === correctOption.id;
    // loadBackgroundVideo(isCorrect ? "true" : "false");
    setQuestionAnswers(prev =>
      prev.map((item, index) =>
        index === currentRound
          ? {
              ...item,
              answer: isCorrect ? 1 : 0,
            }
          : item
      )
    );


    const isLastRound =
    currentRound === content.rounds.length - 1; 
    setSubmitted(true);
    setQuestionGrade(prev => isCorrect ? prev + 1 : prev);
    // let newGrade = pageContext.studentGrade;
    // if (isCorrect) {
    //   newGrade += 1;
    // }		
    // pageContext.setStudentGrade(newGrade);
    const updatedAnswers = questionAnswers.map((item, i) =>
      i === currentRound ? (isCorrect ? 1 : 0) : item.answer
    );

    if (isLastRound) {
      const questionGrade = updatedAnswers.reduce(
        (sum, answer) => sum + answer,
        0
      );
      let finalQuestionAnswer;
      if (questionGrade === 0) {
        finalQuestionAnswer = 0;
      } else if (questionGrade === currentRound + 1) {
        finalQuestionAnswer = 2;
      } else {
        finalQuestionAnswer = 1;
      }
      const newTocState = [
        ...pageContext.tocState,
        {
          gameId: content.gameId,
          questionAnswers: finalQuestionAnswer
        }
      ];

      pageContext.setTocState(newTocState);
    }
     feedbackData = {
      class: isCorrect ? "correct" : "incorrect",
      message: isCorrect ? roundData.feedback.correct.text : roundData.feedback.incorrect.text,
      // canRetry: !isCorrect && pageContext.studentGrade > 0,
      result: isCorrect ? "correct" : "incorrect",
      startTime: startTime.current,
      isCorrect: isCorrect,
			audio: isCorrect? roundData.feedback?.correct?.audio : roundData.feedback?.incorrect?.audio,
      sfx: isCorrect ? CorrectSFX : IncorrectSFX
    };

    setFeedbackParams(feedbackData);
    return { feedbackData };
  };
  
  useEffect(() => {
    if (isVisible) {  
       loadBackgroundVideo();
      startTime.current = Date.now();    
      controls.start("animate");
    }else{
      controls.start("initial");
    }
  }, [isVisible, currentRound]); 

  return (
    <div className="mc-container w-100 component-container">
      <HintButton
        hintData={content.hintData}
        setHintData={setHintData}
      />
      <motion.div ref={containerRef} className="mc-wrapper w-100 component-content" variants={getAnimation("blurIn", 0.8, 0)} initial="initial" animate={controls}>
         <motion.div className="avatarAndScore" variants={getAnimation("flipX", 0.6, 0.4)} initial="initial" animate={controls}>
					<ShowAvatarAndName />
					{/* <ShowScoring /> */}
				</motion.div> 
        <div className="mc-game-container">
          <motion.div className="mainQuestionHolderDiv">
            <motion.div className="mainQuestionHolder" variants={getAnimation("slideDown", 0.6, 0.4)} initial="initial" animate={controls}>
              <Row className="audio-help-container mb-0 mx-0">
                <Col className="d-flex align-items-center justify-content-start col-1 p-0">
                  <AudioWidget data={audioData} audioType="main-question" />
                </Col>
              </Row>
              <motion.div className="mainQuestion" dangerouslySetInnerHTML={{ __html: roundData.mainQuestion }} />
            </motion.div>
          </motion.div>
          {withExplanationScreen ? (
            <motion.div className="text-row-1" variants={getAnimation("scaleIn", 0.6, 0.7)} initial="initial" animate={controls}>
              <motion.div className="explanation-screen w-10" variants={getAnimation("slideRight", 0.6, 1.1)} initial="initial" animate={controls}>
                  <img src={content.explanationScreen.image} alt="Explanation" className="img-fluid"/>
                  <motion.div className="startLessonBtnHolder"  variants={getAnimation("scaleIn", 0.6, 1.7)} initial="initial" animate={controls}>
                    <button className="startLessonBtn"
                      onClick={() => {
                        stopAudio();
                        setWithExplanationScreen(false);
                        requestAnimationFrame(() => {
                          controls.start("animate");
                        });
                      }}
                    >
                       <FormattedMessage id='feedback.continue' />
                    </button>
                  </motion.div>
              </motion.div>
            </motion.div>
            ) : (
            <div className="mc-game-holder">
              <motion.div ref={containerRef} className="mc-content w-100" variants={getAnimation("blurIn", 0.8, 0)} initial="initial" animate={controls}>
                <motion.div className="option-col col d-flex align-items-center justify-content-center" variants={getAnimation("slideLeft", 0.6, 0.9)} initial="initial" animate={controls}>
                  <div className="mc-options">
                    {mcOptions.map((opt) => {
                      const isSelected = selected === opt.id;
                      const isCorrect = submitted && isSelected && opt.correct;
                      const isWrong = submitted && isSelected && !opt.correct;

                      return (
                        <button
                          key={opt.id}
                          className={`mc-option ${checked ? "checked" : ""} ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "incorrect" : ""}    ${submitted ? "disabled" : ""}`}
                          onClick={() => {
                            setSelected(opt.id);
                            setAudioURL({ id: "optionClick", url: ButtonClickSFX, type: "sfx" });
                          }}            
                        >
                          {opt.text}
                          {opt.correct && submitted && isSelected && (
                              <>
                                {/* <div className='symbolHolder'>
                                  <CheckRounded className={`me-3`} /> 
                                </div> */}
                                <ShowCorrectStars />
                              </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
              {selected  && (
                <div className="feedback-container-holder">
                  <Feedback
                    feedback={feedbackParams}
                    submitLimit={roundData.submitLimit}
                    handleSubmit={checkAnswers}
                    handleContinue={goToNextRound}
                    visibility={selected}
                    ref={feedbackSubmitButtonRef}
                  />
                </div>
              )}  
              {content.rounds?.length > 1 && (
                <motion.div className="round-progress" variants={getAnimation("scaleIn", 0.6, 1.7)} initial="initial" animate={controls}>
                  {content.rounds.map((roundMap, roundIndex) => (
                    <div  className="dotAndLine" key={roundIndex}>
                      <div className={`round-dot ${ roundIndex < currentRound ? "completed" : roundIndex === currentRound ? "active" : ""}`}>
                        {roundIndex + 1}
                      </div>
                      {roundIndex < content.rounds.length - 1 && (
                        <div className={`round-line ${ roundIndex < currentRound ? "completed" : "" }`}/>
                      )}
                    </div>
                  ))}
                </motion.div>
                )}
            </div>
          )}
        </div>
      </motion.div>  
      {backgroundVideoData && 
        (() => {
          return (
            <video
              ref={backgroundVideoRef}
              className="videoSplashScreen"
              src={backgroundVideoData}
              poster={new URL(`../../../container/videos/mission${gameIndex}_${avatarSelected}_question${currentRound + 1}_thumbnail.png`, import.meta.url).href}
              autoPlay  
              muted  
              playsInline
              loop
            />
          );
        })()
      }
    </div>
  );
};

export default MultipleChoice;
