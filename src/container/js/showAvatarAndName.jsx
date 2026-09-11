import React, {useContext, useRef, useEffect } from "react";
import { PageContext } from "./utilities/context";

const ShowAvatarAndName = () => {
  const { avatarSelected, userName } = useContext(PageContext);
  return (
    <>
      {
        avatarSelected && (
          <div className="avatarImageNameHolder">
            <img src={`./images/${avatarSelected}_selected.png`} alt="Selected Avatar" className="selected-avatar-image" />
            <div className="UserNameText" dangerouslySetInnerHTML={{ __html: userName }} />
          </div>
        )
      }
    </>
  );
};

export default ShowAvatarAndName;