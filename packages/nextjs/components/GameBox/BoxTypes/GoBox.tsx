//import "./boxTypes.scss";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GoBox = ({ name }: { name: any }) => (
  <div className="p-4 bg-green-500 text-white rounded-lg flex justify-center items-center h-32">
    <div className="text-center">
      <p className="font-bold text-lg">
        Collect <br /> $200 Salary <br /> as you pass
      </p>
      <div className="go-text text-xl font-extrabold">{name}</div>
    </div>
  </div>
);
