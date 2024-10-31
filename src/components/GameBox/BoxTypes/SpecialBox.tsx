/* eslint-disable @typescript-eslint/no-explicit-any */
import chanceIcon from "../../../assets/question.png";
import communityIcon from "../../../assets/chest.png";
import railRoadIcon from "../../../assets/rail.png";
import taxIcon from "../../../assets/tax.png";
import { BOX_TYPES } from "../../../../backend/shared/constants";
import "./boxTypes.scss";

type BoxType = keyof typeof BOX_TYPES;

interface SpecialBoxProps {
  type: BoxType;
  name?: string;
  price?: number;
  pricetext?: string;
}

export const SpecialBox: React.FC<SpecialBoxProps> = ({ type, name, price, pricetext }) => {
  const boxImages: { [key in BoxType]?: string } = {
    GO: chanceIcon,
    CHANCE: chanceIcon,
    COMMUNITY: communityIcon,
    RAILROADS: railRoadIcon,
    TAX: taxIcon,
  };

  const getBoxImage = () => {
    const imageSrc = boxImages[type];
    return imageSrc ? <img src={imageSrc} alt={`${type} Icon`} /> : null;
  };

  const getBoxText = () => {
    if (type === "CHANCE") return "Chance";
    if (type === "COMMUNITY") return "Community";
    
    return name || ""; // Default to `name` if provided
  };
  
  return (
    <div className="chance-box">
      <div className="box-text">{getBoxText()}</div>
      <div className="box-image">{getBoxImage()}</div>
      {price && <div className="box-price">{`$${price}`}</div>}
      {pricetext && !price && <div className="box-price">{`${pricetext}`}</div>}
    </div>
  );
};
