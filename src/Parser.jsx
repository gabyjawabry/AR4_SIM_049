import React, { useState } from 'react';
import LessonPage from './container/js/lessonPage.jsx';

const Parser = (props) => {

  return (
    <LessonPage appCurrentState = {props.appCurrentState} />
  );
};

export default Parser;