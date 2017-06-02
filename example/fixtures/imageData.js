import shortid from 'shortid';

const imagesA = [
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4155/34729323745_5f48b08d11_m.jpg',
    src: 'https://c1.staticflickr.com/5/4155/34729323745_5f48b08d11_b.jpg',
    width: 1024,
    height: 683,
    title: 'Lorem Ipsum',
    desc: '无人爱苦，亦无人寻之欲之，乃因其苦...',
  },
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4185/34567479622_f20c36c6df_m.jpg',
    src: 'https://c1.staticflickr.com/5/4185/34567479622_f20c36c6df_b.jpg',
    width: 1024,
    height: 683,
    title: 'Very Long desc',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4176/33873416524_6f7747056c_m.jpg',
    src: 'https://c1.staticflickr.com/5/4176/33873416524_73c412f3ac_k.jpg',
    width: 539,
    height: 2048,
  },
  { id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4180/33906312003_65219c00d0_m.jpg',
    src: 'https://c1.staticflickr.com/5/4180/33906312003_65219c00d0_b.jpg',
    width: 1024,
    height: 683,
  },
  { id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4161/33873409014_3bfc13000b_m.jpg',
    src: 'https://c1.staticflickr.com/5/4161/33873409014_3bfc13000b_b.jpg',
    width: 1024,
    height: 683,
  },
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4193/33920093523_c652cca848_m.jpg',
    src: 'https://c1.staticflickr.com/5/4193/33920093523_c652cca848_b.jpg',
    width: 683,
    height: 1024,
  },
];

const imagesB = imagesA.map((image) => {
  const newImage = Object.assign({}, image);
  newImage.id = shortid.generate();
  return newImage;
});

const imagesC = imagesA.map((image) => {
  const newImage = Object.assign({}, image);
  newImage.id = shortid.generate();
  return newImage;
});

export {
  imagesA,
  imagesB,
  imagesC,
};
