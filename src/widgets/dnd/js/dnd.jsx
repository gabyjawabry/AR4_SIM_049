import React, { useState, useEffect, useRef, useContext  } from 'react';
import "../css/dnd.scss";
import AudioWidget from '../../../container/js/audioWidget.jsx';
import { Col, Row } from 'react-bootstrap';
import { motion, useAnimation } from "framer-motion";
import DraggableItem from './DraggableItem.jsx';
import DropTextInline from './DropTextInline.jsx';
import ShowAvatarAndName from '../../../container/js/showAvatarAndName.jsx';
import ShowScoring from '../../../container/js/showScoring.jsx';
import HintButton from '../../../container/js/hintButton.jsx';
import { getAnimation, shuffle, useIsVisible, getWidgetState, saveWidgetState } from "../../../container/js/utilities/utilities.jsx";
import { PageContext } from "../../../container/js/utilities/context.jsx";
import { DndContext, useDndMonitor } from '@dnd-kit/core';
import Feedback from '../../../container/js/feedback.jsx';
import DropSFX from '../sounds/drop.mp3';
import CorrectSFX from '../sounds/gauge_correct.mp3';
import IncorrectSFX from '../sounds/gauge_incorrect.mp3';
import { getAnimationAsync } from '../../../container/js/utilities/helper.jsx';
import { FormattedMessage } from "react-intl";

const DndInner = ({ droppableRefs, selectedAnswers, setSelectedAnswers, setActiveId, setUsedItems, usedItems, round, saveComponentState }) => {
	const { setAudioURL } = useContext(PageContext);

	useDndMonitor({
		onDragStart(e) {
			setActiveId(e.active.id);
		},

		onDragEnd(e) {
			setActiveId(null);
			if (!e.over) return;

			if (usedItems.includes(e.active.id)) return;

			const droppableIndex = e.over.data.current?.index;
			if (typeof droppableIndex !== "number") return;

			const droppable = droppableRefs.current[droppableIndex];
			if (!droppable) return;

			const oldItems = droppable.getDroppedItems?.() || [];

			if (oldItems.length > 0) {
				droppable.reset();

				setUsedItems(prev =>
					prev.filter(id => !oldItems.some(item => item.id === id))
				);
			}
			const dragData = e.active.data.current || {};

			const droppedItem = {
				id: e.active.id,
				value: dragData.value,
				type: dragData.type,
				dataIndex: dragData.dataIndex,
				droppableItem: {
					id: e.over.data.current?.id,
					index: e.over.data.current?.index
				},
				restored: false
			};

			droppable.addDroppedItem(droppedItem);

			setAudioURL({id: "drop", url: DropSFX, type: "sfx"});

			// setSelectedAnswers(prev => {
			// 	const copy = [...prev];
			// 	copy[droppableIndex] = e.active.id;
			// 	return copy;
			// });

			// setUsedItems(prev => [...new Set([...prev, e.active.id])]);

			const newSelectedAnswers = [...selectedAnswers];
			newSelectedAnswers[droppableIndex] = e.active.id;

			const newUsedItems = [...usedItems];
			newUsedItems[droppableIndex] = e.active.id;

			setSelectedAnswers(newSelectedAnswers);
			setUsedItems(newUsedItems);

			// saveWidgetState(pageContext, widgetId, { selectedAnswers: newSelectedAnswers, usedItems: newUsedItems });
			saveComponentState(newSelectedAnswers, newUsedItems, round);
		}
	});

	return null;
};

const dnd = ({ parameters, index }) => {
	const content = parameters?.content || {};
	const widgetId = content.id;
	const [hasHydrated, setHasHydrated] = useState(false);
	const containerRef = useRef(null);
	const mainContainerRef = useRef(null);
	const controls = useAnimation();
	const isVisible = useIsVisible(containerRef);
	const [currentRound, setCurrentRound] = useState(0);
	const audioData = { url: content.mainQuestionAudio, autoplay: true, id: parameters.id || 0 };
	const pageContext = useContext(PageContext);
	const { avatarSelected, stopAudio } = pageContext;
	const [roundData, setRoundData] = useState(null);
	const [usedItems, setUsedItems] = useState([]);
	const [activeId, setActiveId] = useState(null);
	const [selectedAnswers, setSelectedAnswers] = useState([]);
	const [backgroundVideoData, setBackgroundVideoData] = useState(null);
	const [feedbackParams, setFeedbackParams] = useState({});
	const [droppableClasses, setDroppableClasses] = useState([]);
	const [showDraggables, setShowDraggables] = useState(false);
	const [hintData, setHintData] = useState('');
	const droppableRefs = useRef([]);
	const gameIndex = content.gameId + 1;
	const feedbackSubmitButtonRef = useRef();
	const startTime = useRef(null);
	// const dndData = content.rounds[currentRound];
	const [isLocked, setIsLocked] = useState(false);
	const [withExplanationScreen, setWithExplanationScreen] = useState(content.withExplanationScreen || false);
	const backgroundVideoRef = useRef();
	const animationBranchKey = withExplanationScreen ? "explanation" : "game";
	  const [questionAnswers, setQuestionAnswers] = useState(
    () =>
      (content.rounds || []).map((_, index) => ({
        gameId: content.gameId,
        round: index + 1,
        answer: null,
      }))
  );

	useEffect(() => {
		async function loadBackgroundVideo() {
			const anim = await getAnimationAsync(`mission${gameIndex}_question${currentRound + 1}`);
    		setBackgroundVideoData(anim);		
		}

		if (isVisible) {
			loadBackgroundVideo();
			startTime.current = Date.now();

			if (!hasHydrated) {
				const savedState = getWidgetState(pageContext, widgetId);
				
				if (savedState && Object.keys(savedState).length) {
					const savedStateRound = savedState[Object.keys(savedState).length - 1];
					// if (savedState.allItems) {
					// 	setRoundData(savedState.allItems);
					// }

					if (Array.isArray(savedStateRound.selectedAnswers)) {
						setSelectedAnswers(savedStateRound.selectedAnswers);
					}

					if (Array.isArray(savedStateRound.usedItems)) {
						setUsedItems(savedStateRound.usedItems);
					}

					if (savedStateRound?.round !== undefined && savedStateRound?.round !== null) {
						setCurrentRound(savedStateRound.round);
						setWithExplanationScreen(false);
					}

					if (Array.isArray(savedStateRound.selectedAnswers) && savedStateRound.selectedAnswers.length) {
						setTimeout(() => {
							savedStateRound.selectedAnswers.forEach((dragId, index) => {
								const droppable = droppableRefs.current[index];
								if (!droppable || !dragId ) return;
								const drag = roundData.draggableItems?.find(d => d.id === dragId);
								if (!drag) return;
								droppable.addDroppedItem({
									id: drag.id,
									value: drag.value,
									type: drag.type,
									dataIndex: drag.dataIndex,
									droppableItem: {
										id: roundData.droppableItems[index]?.id,
										index
									},
									restored: true
								});
							});
						}, 2000);
					}

					if (savedStateRound.result != null && typeof savedStateRound.result !== 'undefined') {
						checkAnswers('restore', savedStateRound?.attempt, savedStateRound.selectedAnswers || [], savedStateRound.usedItems || [], content.rounds[savedStateRound.round] || []);
					}else{
						const feedbackData = {
							class: "",
							message: "",
							canRetry: null,
							answers: [],
							result: null,
							startTime: startTime.current,
							isCorrect: null,
							audio: "",
							sfx: "",
							restored: 'restore',
							attemptNumber: savedStateRound?.attempt == -1 ? 0 : savedStateRound?.attempt
						};

						setFeedbackParams(feedbackData);
					}
				}

				setTimeout(() => {
					controls.start("animate");
				}, 1000);

				setHasHydrated(true);
			}else{
				controls.start("animate");
			}
		} else {
			controls.start("initial");
		}
	}, [isVisible, currentRound, content, avatarSelected]);

	// useEffect(() => {
	// 	if(dndData){
	// 		const finalDraggables = shuffle(dndData.draggableItems);
	// 		setRoundData({
	// 			...dndData,
	// 			draggableItems: finalDraggables
	// 		});
	// 		// setSelectedAnswers([]);
	// 		// setUsedItems([]);
	// 		// setDroppableClasses([]);
	// 		// setFeedbackParams({});
	// 		// droppableRefs.current = [];
	// 		setShowDraggables(false);
	// 		setTimeout(() => setShowDraggables(true), 300);
	// 	}
	// }, [dndData]);

	useEffect(() => {
		const dndData = content.rounds[currentRound];
		if(dndData){
			const finalDraggables = shuffle(dndData.draggableItems);
			setRoundData({
				...dndData,
				draggableItems: finalDraggables
			});
			// setSelectedAnswers([]);
			// setUsedItems([]);
			// setDroppableClasses([]);
			// setFeedbackParams({});
			// droppableRefs.current = [];
			setShowDraggables(false);
			setTimeout(() => setShowDraggables(true), 300);
		}
	}, [currentRound]);

	const filledAnswers = selectedAnswers.filter(ans => ans);
	const allItemsDropped = roundData?.droppableItems?.length === filledAnswers.length;

	const handleRemoveDroppedItem = (droppableIndex) => {
		const droppable = droppableRefs.current[droppableIndex];
		if (!droppable) return;

		const droppedItems = droppable.getDroppedItems?.() || [];
		if (droppedItems.length === 0) return;

		const removedId = droppedItems[0].id;
		droppable.reset();

		// setSelectedAnswers(prev => {
		// 	const copy = [...prev];
		// 	copy[droppableIndex] = null;
		// 	return copy;
		// });

		// //setUsedItems(prev => prev.filter(id => id !== removedId));
		// setUsedItems(prev => {
		// 	const copy = [...prev];
		// 	const indexToReplace = copy.findIndex(id => id === removedId);
		// 	if (indexToReplace >= 0) {
		// 		copy[indexToReplace] = null;
		// 	}
		// 	return copy;
		// });

		const nextSelectedAnswers = [...selectedAnswers];
		nextSelectedAnswers[droppableIndex] = null;

		const nextUsedItems = [...usedItems];
		const indexToReplace = nextUsedItems.findIndex(id => id === removedId);
		if (indexToReplace >= 0) {
			nextUsedItems[indexToReplace] = null;
		}

		setSelectedAnswers(nextSelectedAnswers);
		setUsedItems(nextUsedItems);

		setDroppableClasses(prev => {
			const copy = [...prev];
			copy[droppableIndex] = "";
			return copy;
		});

		saveComponentState(nextSelectedAnswers, nextUsedItems, currentRound);
	};

  	const checkAnswers = (type = 'submit', attemptNumber = 1, answersToEvaluate = selectedAnswers, itemsToEvaluate = usedItems, dataToEvaluate = roundData) => {
		let feedbackData = {};
		let answers = [];
		setIsLocked(true);

		if (type === "tryagain") {
			setIsLocked(false);

			if (pageContext.studentGrade <= 0) {
				droppableRefs.current.forEach(d => d?.reset?.());
				setSelectedAnswers([]);
				setUsedItems([]);
				setDroppableClasses([]);
				setFeedbackParams({});
				//saveWidgetState(pageContext, widgetId, { selectedAnswers: [], usedItems: [], attempt: attemptNumber, result: null });
				saveComponentState([], [], currentRound, attemptNumber, null);
				return;
			}

			const newSelectedAnswers = [...answersToEvaluate];
			const correctUsedItems = [];
			const newClasses = [];

			answersToEvaluate.forEach((ans, i) => {
				const drag = dataToEvaluate.draggableItems?.find(d => d.id === ans);
				const drop = dataToEvaluate.droppableItems?.[i];
				const isCorrectAnswer = drag?.dataIndex === drop?.dataIndex;
				if (isCorrectAnswer) {
					//correctUsedItems.push(ans);
					correctUsedItems[i] = ans;
					newClasses[i] = "correct";
				} else {
					droppableRefs.current[i]?.reset?.();
					newSelectedAnswers[i] = null;
					correctUsedItems[i] = null;
					newClasses[i] = "";
				}
			});

			setSelectedAnswers(newSelectedAnswers);
			setUsedItems(correctUsedItems);
			setDroppableClasses(newClasses);
			setFeedbackParams({});
			//saveWidgetState(pageContext, widgetId, { selectedAnswers: newSelectedAnswers, usedItems: correctUsedItems, attempt: attemptNumber, result: null });
			saveComponentState(newSelectedAnswers, correctUsedItems, currentRound, attemptNumber, null);
			return;
		}

		if (type === "reset") {
			droppableRefs.current.forEach(d => d?.reset?.());
			setSelectedAnswers([]);
			setUsedItems([]);
			setDroppableClasses([]);
			setFeedbackParams({});
			//saveWidgetState(pageContext, widgetId, { selectedAnswers: [], usedItems: [], attempt: attemptNumber, result: null });
			saveComponentState([], [], currentRound, attemptNumber, null);
			return;
		}

		let correct = 0;
		let classes = [];

		answersToEvaluate.forEach((ans, i) => {
			const drag = dataToEvaluate.draggableItems?.find(d => d.id === ans);
			const drop = dataToEvaluate.droppableItems?.[i];
			if (!drag || !drop) return;
			if (drag.dataIndex === drop.dataIndex) {
				correct++;
				classes[i] = "correct";
			} else {
				classes[i] = "incorrect";
			}

			answers.push({
				item: {
					id: drag.id,
					content: {
						text: drag.value
					}
				},
				droppedId: drop.id
			});
		});

		setDroppableClasses(classes);

		//Gaby
		const isCorrect = correct === dataToEvaluate.droppableItems.length;
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

	 	const isLastRound = currentRound === content.rounds.length - 1;	
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


		if (isCorrect) {
			setIsLocked(true);
		}

		if (type !== 'restore') {
			// const tocIndex = index; 
			// const newTocState = pageContext.tocState;
			// newTocState.push({
			// 	index: tocIndex,
			// 	status: isCorrect ? "correct" : "incorrect"
			// });
			// pageContext.setTocState(newTocState);

			// saveWidgetState(pageContext, "mainScreen", { tocState: newTocState });
			// saveTOCState(isCorrect);
		}

		// let newGrade;
		// if (type !== 'restore') {
		// 	newGrade = isCorrect ? pageContext.studentGrade + 5: Math.max(0, pageContext.studentGrade - 5);
		// 	pageContext.setStudentGrade(newGrade);
		// }else{
		// 	newGrade = pageContext.studentGrade;
		// }

		feedbackData = {
			class: isCorrect ? "correct" : "incorrect",
			message: isCorrect ? dataToEvaluate.feedback?.correct?.text : dataToEvaluate.feedback?.incorrect?.text,
			//canRetry: !isCorrect && pageContext.studentGrade > 0,
			answers: answers,
			result: isCorrect ? "correct" : "incorrect",
			startTime: startTime.current,
			isCorrect: isCorrect,
			audio: isCorrect? dataToEvaluate.feedback?.correct?.audio  : dataToEvaluate.feedback?.incorrect?.audio,
			sfx: isCorrect ? CorrectSFX : IncorrectSFX,
			restored: type === 'restore',
			attemptNumber: attemptNumber
		};

		setFeedbackParams(feedbackData);
		if (type !== 'restore') {
			// saveWidgetState(pageContext, widgetId, { selectedAnswers: answersToEvaluate, usedItems: itemsToEvaluate, attempt: attemptNumber, result: isCorrect }, true);
			//saveWidgetState(pageContext, "score", { score: newGrade });
			saveComponentState(answersToEvaluate, itemsToEvaluate, currentRound, attemptNumber, isCorrect);
		}

		return { feedbackData };
	};

	const goToNextRound = () => {
		
		const isLastRound = currentRound === content.rounds.length - 1;	

		if (!isLastRound) {
			droppableRefs.current.forEach(d => d?.reset?.());
			setCurrentRound(prev => prev + 1);
			setSelectedAnswers([]);
			setUsedItems([]);
			setDroppableClasses([]);
			setFeedbackParams({});
			setIsLocked(false);	

			droppableRefs.current = [];
		} else {
			const swiper = document.querySelector('#container-swiper')?.swiper;	
			if (swiper) swiper.slideNext(1);
		}
	};

	const saveComponentState = (selectedAnswers, usedItems, round, attempt = -1, result = null) => {
		const savedState = getWidgetState(pageContext, widgetId) || {};

		const updatedEntry = {
			selectedAnswers,
			usedItems,
			round,
			attempt: attempt == -1 && savedState[round]?.attempt ? savedState[round].attempt : attempt,
			//result: result == null && savedState[round] ? savedState[round].result : result,
			result
		};

		const nextState = {
			...savedState,
			[round]: updatedEntry,
		};

		saveWidgetState(pageContext, widgetId, nextState, true);
	}

	const saveTOCState = (isCorrect) => {
		const tocIndex = content.index;
		const currentTocState = Array.isArray(pageContext.tocState)
			? [...pageContext.tocState]
			: [];

		const existingEntryIndex = currentTocState.findIndex(
			item => item.index === tocIndex
		);

		let nextTocState;

		if (existingEntryIndex >= 0) {
			nextTocState = currentTocState.map((item, index) =>
				index === existingEntryIndex
					? { ...item, status: isCorrect ? "correct" : "incorrect" }
					: item
			);
		} else {
			nextTocState = [
				...currentTocState,
				{
					index: tocIndex,
					status: isCorrect ? "correct" : "incorrect",
				},
			];
		}

		pageContext.setTocState(nextTocState);
		saveWidgetState(pageContext, "mainScreen", { tocState: nextTocState });
 	}

	return ( 
		<div className="dnd-container component-container w-100" style={{ backgroundImage: `url(images/toc_bg.png)`,}}>
			<HintButton
        		hintData={content.hintData}
       			setHintData={setHintData}
      		/>
			<motion.div ref={containerRef} className="dnd-wrapper w-100 component-content" variants={getAnimation("blurIn", 0.8, 0)} initial="initial" animate={controls}>
				<motion.div className="avatarAndScore" variants={getAnimation("flipX", 0.6, 0.4)} initial="initial" animate={controls}>
					<ShowAvatarAndName />
					{/* <ShowScoring /> */}
				</motion.div> 
				<div className="dnd-game-container">
					{pageContext.studentGrade === 0 && (
						<HintButton/>
					)}
					<motion.div className="mainQuestionHolderDiv">
						<motion.div className="mainQuestionHolder" variants={getAnimation("slideDown", 0.6, 0.4)} initial="initial" animate={controls}>
							<Row className="audio-help-container mb-0 mx-0">
								<Col className="d-flex align-items-center justify-content-start col-1 p-0">
									<AudioWidget data={audioData} audioType="main-question" />
								</Col>
							</Row>
							<motion.div className="mainQuestion" dangerouslySetInnerHTML={{ __html: content.mainQuestion }}/>
						</motion.div>
					</motion.div>
					{withExplanationScreen ? (
						<motion.div key={animationBranchKey} className="text-row-1" variants={getAnimation("scaleIn", 0.6, 0.7)} initial="initial" animate={controls}>
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
						<motion.div key={animationBranchKey} className="gameMainWrapper" variants={getAnimation("blurIn2", 0.8, 0)} initial="initial" animate={controls}>
							<motion.div className="text-row" variants={getAnimation("scaleIn2", 0.6, 0.7)} initial="initial" animate={controls}>
								<motion.div className="text-col w-10" variants={getAnimation("slideRight", 0.6, 1.1)} initial="initial" animate={controls}>
									<div className="dnd-content">
										<motion.div className="dnd-wrapper" {...getAnimation("blurIn", 0.6, 1)}>
											<DndContext>
												<div className="dropTextHolder">
													<DropTextInline
														dropText={roundData?.dropText}
														droppableItems={roundData?.droppableItems}
														droppableClasses={droppableClasses}
														droppableRefs={droppableRefs}
														setUsedItems={setUsedItems}
														onDroppedItemClick={handleRemoveDroppedItem}
													/>
												</div>
												{showDraggables && (
													<div className="draggable-container">
														{roundData?.draggableItems.map(item => (
															<motion.div key={item.id} {...getAnimation("zoomIn", 0.4, 0)}>
																<DraggableItem
																	id={item.id}
																	type={item.type}
																	value={item.value}
																	dataIndex={item.dataIndex}
																	cssClass = {`draggable-item ${isLocked ? 'disabled' : ''}`}
																	isDragging={activeId === item.id}
																	isUsed={usedItems.includes(item.id)}
																/>
															</motion.div>
														))}
													</div>
												)}
												<DndInner
													droppableRefs={droppableRefs}
													selectedAnswers={selectedAnswers}
													setSelectedAnswers={setSelectedAnswers}
													setActiveId={setActiveId}
													setUsedItems={setUsedItems}
													usedItems={usedItems}
													round={currentRound}
													saveComponentState={saveComponentState}
												/>
											</DndContext>
										</motion.div>
									</div>
								</motion.div>
							</motion.div>
								<div className="feedback-container-holder">
									<Feedback
										feedback={feedbackParams}
										submitLimit={roundData?.submitLimit}
										handleSubmit={checkAnswers}
										handleContinue={goToNextRound}
										visibility={allItemsDropped}
										ref={feedbackSubmitButtonRef}
									/>
								</div>
							{content.rounds?.length > 1 && (
								<motion.div className="round-progress"  variants={getAnimation("scaleIn2", 0.6, 1.7)} initial="initial" animate={controls}>
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
						</motion.div>
					)}
				</div>
			</motion.div>
			{backgroundVideoData && 
				(() => {
					const questionPart = currentRound === 0 ? `1_${avatarSelected}` : currentRound === 1 ? 2 : 3;
					const posterPart = content.rounds?.length === 1 ? avatarSelected : `question${questionPart}`;
					return (
						<video ref={backgroundVideoRef} 
							className="videoSplashScreen" 
							src={backgroundVideoData} 
							poster={new URL(`../../../container/videos/mission${content.gameId}_${posterPart}_poster.png`, import.meta.url).href}
							autoPlay
							muted
							playsInline
						/>
					);
				})()
			}

		</div>
	);
};

export default dnd;
