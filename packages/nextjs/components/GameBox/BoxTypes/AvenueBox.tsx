export const AvenueBox = ({
  name,
  color,
  id,
  price,
  imageName,
}: {
  name?: any;
  color?: any;
  id?: any;
  price?: any;
  imageName?: any;
}) => {
  const getOrientation = () => {
    if ((id >= 1 && id <= 11) || (id >= 21 && id <= 31))
      return "flex-col";
    if (id >= 12 && id <= 20) return "flex-row-reverse items-end";
    return "flex-row items-start";
  };

  return (
    <div className={`avenue-box relative flex ${getOrientation()} border-black`}>
      {/* Box color */}
      <div className="box-color bg-black" style={{ backgroundColor: color }}></div>

      {/* Image */}
      {/* <img
        src={path.replace("Die_1.png", imageName)}
        className="w-6 h-6"
        alt="Box Image"
      /> */}

      {/* Text */}
      <div className="box-text text-center font-bold text-xs mt-2">
        {name}
      </div>

      {/* Price */}
      <div className="box-price text-center font-bold text-xs mt-1">
        {`$${price}`}
      </div>
    </div>
  );
};
