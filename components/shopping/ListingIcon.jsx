const ListingIcon = () => {
  return (
    <div className="flex flex-col gap-4">
      <img src="/collection_img.png" alt="Collection Icon" className="w-full"/>
      <p>Winter Special: Dior X Tom Ford X...</p>
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">$250</span>
        <span>4.5</span>
      </div>
    </div>
  );
};

export default ListingIcon;
