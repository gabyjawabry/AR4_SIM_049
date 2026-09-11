import React, { useRef, useContext, useEffect, useState } from 'react';
import { IntlProvider } from "react-intl";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import videojs from 'video.js';
import { PageContext } from './utilities/context';
import { PageData, LabelsData } from './utilities/helper';
import { useEventSender, SendAppState } from './utilities/logging';
import LessonSlide from './lessonSlide';
import { saveAppState } from "./utilities/utilities";

const LessonPage = ({appCurrentState}) => {
  const audioElement = useRef(null);
  const audioEndedCallbackRef = useRef(null);
  const audioEndedHandlerRef = useRef(null);
  const [tocState, setTocState] = useState([]);
  const [userName, setUserName] = useState("");
  const [avatarSelected, setAvatarSelected] = useState(null);
  // const [studentGrade, setStudentGrade] = useState(15);
  const locale = PageData.page.language;
  const sendEvent = useEventSender();
  const simulationStartTime = useRef(null);
  const [audioWidgetAudioData, setAudioWidgetAudioData] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // TAB key → force intro focus
      if (e.key === "Tab") {
        const introBtn = document.querySelector('.intro-container button');
        if (introBtn) {
          introBtn.focus();
          e.preventDefault();
        }
      }

      // "P" key → stop audio and videos
      if (e.key.toLowerCase() === "p") {
        stopAudio();
        stopAllVideos();
      }
    };

    // Save state before closing browser/tab
    const handleBeforeUnload = (event) => {
      const savedState = appCurrentState.current ?? appCurrentState;
      if(savedState?.status === "IN_PROGRESS" && savedState.currentState?.score.score  === 0){
        const logEvent = {
          timeSpent: {
              activeTime: simulationStartTime.current,
              idleTime: Date.now() - simulationStartTime.current,
              totalTime: Date.now()
          }
        }
        sendEvent('simulation-finished', logEvent);

        Object.assign(savedState, { status: "COMPLETED" });
      }
      
      SendAppState('appState', savedState);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const setAudioURLFromWidget = (audioData, onEndedCallback) => {
    if(audioData?.type != 'sfx')
      stopAllVideos();

    const audio = audioElement.current;
    if (!audio) return;

    if (audioEndedHandlerRef.current) {
      audio.removeEventListener("ended", audioEndedHandlerRef.current);
    }

    const isPlaying =
      audio.currentTime > 0 &&
      !audio.paused &&
      !audio.ended &&
      audio.readyState > audio.HAVE_CURRENT_DATA;

    try {
      let updatedAudioData = { ...audioData };

      if (audioData?.url) {
        if (audio.src.includes(audioData.url)) {
          // toggle play/pause
          if(audioData?.type == 'sfx'){
            audio.currentTime = 0;
            audio.play();
            updatedAudioData.playing = true;
          }else{
            if(audio.paused) {
              audio.play(); 
              updatedAudioData.playing = true;
            }else { 
              audio.pause();
              updatedAudioData.playing = false;
            }
          }

          // Call setAudioWidgetAudioData only for same URL case
          setAudioWidgetAudioData(updatedAudioData);
        } else {
          audio.pause();
          audio.currentTime = 0;

          setTimeout(() => {
            audio.id = audioData.id;
            audio.setAttribute('data-type', audioData.type);
            audio.src = audioData.url;
            audio.play().catch(() => {}); // prevent crash on autoplay block
            setAudioWidgetAudioData({
              ...updatedAudioData,
              playing: true
            });
          }, 10);
        }
      } else {
        if (isPlaying) {
          audio.pause();
          audio.currentTime = 0;
        }
        setAudioWidgetAudioData(null);
        return;
      }

      // Setup ended listener for all audio cases
      const handleAudioEnded = () => {
        setAudioWidgetAudioData(prev => ({
          ...prev,
          playing: false
        }));
        if(onEndedCallback) onEndedCallback();
      };

      audioEndedHandlerRef.current = handleAudioEnded;
      audio.addEventListener("ended", handleAudioEnded);

    } catch (error) {
      console.log(error);
    }
  };

  const onAudioPlay = (e) => {
    if(e.currentTarget.getAttribute('data-type') === 'sfx') return;

    sendEvent('play', { 
      mediaId: e.currentTarget.id, 
      mediaType: 'audio', 
      playing: true, 
      url: e.currentTarget.src
    });
  }

  const onAudioPause = (e) => {
    if(e.currentTarget.getAttribute('data-type') === 'sfx') return;

    sendEvent('pause', { 
      mediaId: e.currentTarget.id, 
      mediaType: 'audio', 
      playing: false, 
      url: e.currentTarget.src
    });
  }

  const stopAudio = () => {
    const audio = audioElement.current;
    if (!audio) return;

    const isPlaying =
      audio.currentTime > 0 &&
      !audio.paused &&
      !audio.ended &&
      audio.readyState > audio.HAVE_CURRENT_DATA;

    // remove listener
    if (audioEndedHandlerRef.current) {
      audio.removeEventListener("ended", audioEndedHandlerRef.current);
      audioEndedHandlerRef.current = null;
    }

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const stopAllVideos = () => {
    const players = videojs.getAllPlayers();
    players.forEach(player => {
      if (player && !player.paused()) {
        player.pause();
      }
    });
  };

  const setSimulationStartTime = () => {
    simulationStartTime.current = Date.now();
  };

  return (
    <PageContext.Provider
      value={{
        setAudioURL: setAudioURLFromWidget,
        stopAudio: stopAudio,
        stopAllVideos: stopAllVideos,
        userName:userName,
        setUserName: setUserName,
        avatarSelected: avatarSelected,
        setAvatarSelected: setAvatarSelected,
        // studentGrade: studentGrade,
        // setStudentGrade: setStudentGrade,
        tocState: tocState,
        setTocState: setTocState,
        simulationStartTime: simulationStartTime,
        setSimulationStartTime: setSimulationStartTime,
        appCurrentState: appCurrentState,
        audioWidgetAudioData: audioWidgetAudioData
      }}
    >
      <IntlProvider locale={locale} messages={LabelsData[locale]} defaultLocale="ar">
        {PageData.page ? (
          <Container fluid className="h-100 p-0 d-flex flex-column">

            <audio ref={audioElement} preload="auto" onPause={onAudioPause} onPlay={onAudioPlay}/>

            <Container fluid className="slider-wrapper px-0">
              <Row className="h-100 w-100 mx-0 position-relative">
                <Col className="p-0 h-100 position-relative">
                  {PageData.page.content?.[0]?.component_id && (
                    <LessonSlide id={PageData.page.content[0].component_id} tocState={tocState} />
                  )}
                </Col>
              </Row>
            </Container>

          </Container>
        ) : (
          <Container fluid className="h-100 p-0" />
        )}
      </IntlProvider>
    </PageContext.Provider>
  );
};

export default LessonPage;