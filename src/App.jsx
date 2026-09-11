import React, { useState, useEffect, useRef } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import 'bootstrap/dist/css/bootstrap.rtl.min.css'
import './container/css/main.scss';
import Parser from './Parser';
import { fetchJSONData } from './container/js/utilities/helper';
import { useEventSender, registerMessageListener, SendAppState } from './container/js/utilities/logging';
import { debounce, defaultScreenWidth, defaultScreenHeight } from './container/js/utilities/utilities';

function App() {
  const [loading, updateLoading] = useState(true);
  const sendEvent = useEventSender();
  const appCurrentState = useRef(null);

  useEffect(() => {
    let removeMessageListener = null;

    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    fetchJSONData()
      .then(async () => {
        const savedState = await registerMessageListener();
        appCurrentState.current = savedState;
        sendEvent("simulation-loaded", {});
        sendEvent("navigation-visibility-event", {
          name: "navigation-visibility-event",
          show: false,
          occurredOn: Date.now()
        });
        updateLoading(false);
      })
      .catch(error => console.error(error.message));
    
    // // Save state before closing browser/tab
    // const handleBeforeUnload = (event) => {
    //   SendAppState('appState', appCurrentState.current ?? appCurrentState);
    // };

    // window.addEventListener('beforeunload', handleBeforeUnload);
    // return () => window.removeEventListener('beforeunload', handleBeforeUnload);

  }, []);

  useEffect(() => {
    const resizeContainer = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const root = document.querySelector('#root');
      const horScale = viewportWidth / defaultScreenWidth;
      const verScale = viewportHeight / defaultScreenHeight;
      const scale = Math.min(horScale, verScale);
      root.style.setProperty('max-width', defaultScreenWidth + 'px');
      root.style.setProperty('max-height', defaultScreenHeight + 'px');
      root.style.setProperty('min-width', defaultScreenWidth + 'px');
      root.style.setProperty('min-height', defaultScreenHeight + 'px');
      root.style.setProperty('transform', 'scale(' + scale + ')');
    };
    const debouncedResize = debounce(resizeContainer, 10);
    window.addEventListener('resize', debouncedResize);
    resizeContainer();
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  return (
    <>
      {loading ? (
        <div className="loading-container">
          <div className="spinner-border" role="status" style={{ width: '7.5rem', height: '7.5rem', borderWidth: '0.5em', borderTopColor: '#452B74', color: '#452B74' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
          <Container fluid role="main" className={`px-0 h-100 lesson-container pb-0`}>
            <Row className="h-100 mx-0 px-0">
              <Col className="h-100 mx-0 px-0">
                <Parser appCurrentState = {appCurrentState}/>
              </Col>
            </Row>
          </Container>
      )}
    </>
    
  );
};

export default App;
