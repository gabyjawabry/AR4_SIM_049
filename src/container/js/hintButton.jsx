import React, { useState, useContext } from "react";
import LightbulbRounded from '../images/icons/hint.svg?react';
import { motion } from "framer-motion";
import { Button } from 'react-bootstrap';
import { getAnimation } from "./utilities/utilities";
import { PageContext } from "./utilities/context";
import AudioWidget from "./audioWidget";
import HintOpenSFX from '../audio/open.mp3';
import HintCloseSFX from '../audio/close.mp3';

const HintButton = ({ hintData }) => {
  const hintText = hintData?.hintText;
  const hintImage = hintData?.hintImage;
  const hintAudio = hintData?.hintAudio;
  const [showHint, setShowHint] = useState(false);
  const [renderHint, setRenderHint] = useState(false);
  const { setAudioURL, stopAudio } = useContext(PageContext);
  const audioData = {
    url: hintAudio,
    autoplay: true,
    id: "hintAudio"
  };
  const openHint = () => {
    setAudioURL({ id: "hintOpen", url: HintOpenSFX, type: "sfx" });
    if (!showHint) {
      setRenderHint(true);
      setShowHint(true);
    }
  };

  const closeHint = () => {
    stopAudio();
    setAudioURL({ id: "hintClose", url: HintCloseSFX, type: "sfx" });
    // setShowHint(false);
    // setTimeout(() => setRenderHint(false), 500);
    setRenderHint(false);
    setTimeout(() => setShowHint(false), 1500);
  };

  return (
    <>
      <Button aria-label="Open hint" className={`show-hint-button btn ${showHint ? 'hintBtnSelected' : ''}`} onClick={openHint}>
        <LightbulbRounded />
      </Button>

      {showHint && (
        <motion.div className="hint-button hint-button-text" {...(renderHint ? getAnimation("fade", 0.4, 0) : getAnimation("fadeOut", 0.4, 0.7))}>
          <div className='hint-holder'>
            <motion.div {...(renderHint ? getAnimation("zoomIn", 0.6, 0.5) : getAnimation("zoomOut", 0.4, 0))} className="hint-content">
              <button className="hint-close-btn" aria-label="Close hint" onClick={closeHint}>×</button>
              <>
                  {hintText && (
                    <div className="hint-inner-text" dangerouslySetInnerHTML={{ __html: hintText }} />
                  )}
                  {hintImage && (
                      <img className="hint-inner-image" src={hintImage} alt="" />
                  )}
              </>
              {hintAudio && (
                <div className="hint-audio-container">
                  <AudioWidget data={audioData} audioType="hint" />
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default HintButton;
