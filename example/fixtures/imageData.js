import shortid from 'shortid';

const imagesA = [
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4155/34729323745_5f48b08d11_m.jpg',
    src: 'https://c1.staticflickr.com/5/4155/34729323745_5f48b08d11_b.jpg',
    width: 1024,
    height: 683,
    title: 'Author: Hector Argüello Canals',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eget augue in massa semper tincidunt. Nam porttitor cursus convallis. Nam ac justo ut ligula tincidunt dictum. Pellentesque eu ipsum orci. Etiam auctor velit lacus, eget eleifend mi tempus vitae. Nullam consectetur, lorem vitae convallis porta, velit felis cursus nunc, non semper nunc justo id risus. Pellentesque ornare mauris quam, at scelerisque ligula mollis eget. Donec accumsan at purus in sodales. Cras aliquet accumsan libero eget porta. Nunc et urna molestie, gravida lacus nec, luctus sem. Integer ut ullamcorper elit. Nullam imperdiet elit est, at convallis arcu ultrices nec. Maecenas mattis pulvinar orci sit amet varius.',
  },
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4176/33873416524_6f7747056c_m.jpg',
    src: 'https://c1.staticflickr.com/5/4176/33873416524_73c412f3ac_k.jpg',
    width: 539,
    height: 2048,
    title: 'Lorem Ipsum',
    desc: 'Donec molestie dolor ac lorem lacinia, semper convallis ligula molestie. Pellentesque eu ligula est. Maecenas posuere dui eget metus congue rutrum. Integer eget nisl eu velit congue mollis. Etiam non fringilla ipsum, sed euismod eros. Suspendisse potenti. Nam id consectetur ligula, a sollicitudin nulla. Duis volutpat, dolor id congue finibus, velit metus eleifend justo, luctus vulputate ante dui in justo. Ut eget mauris arcu. Ut nec felis bibendum, vehicula eros nec, venenatis felis. Integer ultricies velit ac metus tempor, a finibus ante sollicitudin.',
  },
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4185/34567479622_f20c36c6df_m.jpg',
    src: 'https://c1.staticflickr.com/5/4185/34567479622_f20c36c6df_b.jpg',
    width: 1024,
    height: 683,
    title: 'Author: Greg Rakozy',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4193/33920093523_c652cca848_m.jpg',
    src: 'https://c1.staticflickr.com/5/4193/33920093523_c652cca848_b.jpg',
    width: 683,
    height: 1024,
    title: 'Author: Joski Byrne',
    desc: 'In leo turpis, posuere ac sodales vestibulum, faucibus et urna. Mauris gravida consequat convallis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris tempor mattis nulla ut feugiat. Nulla quis nisl porttitor, egestas velit nec, viverra urna. Morbi ac diam at eros pretium bibendum a eget nisl. Ut libero leo, condimentum quis tempus nec, tincidunt vestibulum turpis.',
  },
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4242/34938412741_48b32c5755_m.jpg',
    src: 'https://c1.staticflickr.com/5/4242/34938412741_48b32c5755_b.jpg',
    width: 1024,
    height: 682,
    title: 'Authro: Ray Hennessy',
    desc: 'Curabitur tincidunt efficitur leo quis hendrerit. Aliquam erat volutpat. Suspendisse ut facilisis lectus, a porttitor sapien. Maecenas euismod lacus quis diam accumsan, in vestibulum libero dignissim. Nulla posuere risus eu libero blandit euismod sed et sapien. Vivamus dictum et lacus id convallis. Donec libero justo, laoreet eu feugiat sed, interdum id lectus.',
  },
  {
    id: shortid.generate(),
    msrc: 'https://c1.staticflickr.com/5/4237/34938289531_b6ff9765fc.jpg',
    src: 'https://c1.staticflickr.com/5/4237/34938289531_b68f2d4809_o.gif',
    width: 268,
    height: 274,
    title: 'Nick Young',
    desc: 'Ut iaculis molestie tempor. In condimentum tortor ex, eu commodo justo tincidunt vel. Nullam molestie quam non augue rhoncus imperdiet. Donec imperdiet libero id mauris feugiat, nec auctor purus condimentum. Nunc non faucibus leo. Vestibulum placerat dui non sem aliquam tempor. Ut sollicitudin ligula eget erat dapibus interdum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed vitae mi rutrum, aliquet quam vel, euismod magna.',
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
