import { Article } from '../types';

const MOCK_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Manfaat Sorghum untuk Diet Bebas Gluten',
    category: 'Nutrisi',
    readTime: '5 Menit Baca',
    snippet:
      'Sorghum adalah alternatif biji-bijian bebas gluten yang kaya serat. Pelajari bagaimana mengintegrasikannya ke dalam pola makan harian Anda tanpa mengorbankan rasa.',
    content:
      'Diet bebas gluten bukan lagi sekadar tren kesehatan, melainkan kebutuhan bagi banyak individu dengan intoleransi gluten atau penyakit celiac. Di tengah pencarian alternatif gandum yang berkelanjutan dan padat nutrisi, Sorghum muncul sebagai primadona baru di dunia kuliner modern. Biji-bijian kuno ini tidak hanya aman bagi pencernaan, tetapi juga membawa profil nutrisi yang melampaui biji-bijian konvensional lainnya.\n\nSorghum secara alami bebas gluten, menjadikannya bahan dasar yang sangat aman untuk berbagai olahan pangan. Namun, keunggulannya tidak berhenti di sana. Sorghum mengandung serat yang sangat tinggi, membantu menjaga kesehatan mikrobioma usus dan memberikan rasa kenyang lebih lama, yang sangat krusial dalam manajemen berat badan.\n\nIntegrasi sorghum ke dalam diet harian sangatlah mudah. Anda dapat menggunakan tepung sorghum sebagai pengganti tepung terigu dalam pembuatan kue, atau mengolah biji sorghum utuh layaknya nasi atau quinoa. Teksturnya yang sedikit kenyal dan rasanya yang cenderung netral dengan sentuhan \'nutty\' menjadikannya kanvas sempurna untuk berbagai bumbu masakan Indonesia.\n\nDi BESTARI, kami berdedikasi untuk menghadirkan sorghum dalam kualitas terbaik melalui proses pengolahan yang menjaga integritas nutrisinya. Dari ladang yang terawat hingga ke meja makan Anda, setiap butir sorghum kami adalah manifestasi dari komitmen terhadap kesehatan dan keberlanjutan lingkungan.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBi2ENR_93XnNmbYtIH2_fKZTLCzLu5Hzf7KwqpYvD1zJElInu2beJowvQirSxwryo8Yl7qdouBtOZ0P2_intlG3pYvjDuMzZBcRbRIMzGGNuffvJbS7t5T3qrArGBZsIKsNXo2_5alWI_F3wCEZIEWFyPhc3h4QwhM7xzTd-oBPdYlvh_weFLUDKcgneLUGCYToPzmcVISwwLQyx_REPe3H_GHTaxn7rjt_cCvXS947BwkXZYC1iGB4w',
    subImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDuHykNwQgW0Rs2Bovsk1_coUM0_feNAbh7qxnNLx9fmCRaL4puO8wRJLeHKQFjM0YytJKC12B2Zy8bTvBK16Acm9iVwOzZymcD_51isSWrea0iG4IL0CcHposBKpAu3nO1-r7rYTkVfJvpESNfBMbwahEuq7FfsqI3vvtIwEPym_pFCJfrjHpyrzrzoqxIKYP67mrjnv4C3Ue85AbHIGvHyfuYpV7aeQ0WbY8y3B7iCoVcq2K1znPAPA',
    quote:
      'Sorghum bukan sekadar pengganti; ia adalah peningkatan kualitas nutrisi dalam piring Anda. Dengan indeks glikemik rendah, ia membantu menjaga stabilitas energi sepanjang hari tanpa lonjakan gula darah.',
    date: '12 Oktober 2023',
    author: 'Arisanti Putri',
    authorRole: 'Lead Product Researcher',
    facts: [
      { title: 'Gluten-Free', desc: 'Aman 100% untuk diet bebas gandum.' },
      { title: 'High Fiber', desc: 'Mendukung pencernaan yang optimal.' },
      { title: 'Low Glycemic Index', desc: 'Membantu mengontrol gula darah.' },
      { title: 'Rich in Antioxidants', desc: 'Melindungi sel tubuh dari radikal bebas.' },
    ],
  },
  {
    id: 'art-2',
    title: 'Ketahanan Pangan Melalui Pertanian Lokal',
    category: 'Budidaya',
    readTime: '8 Menit Baca',
    snippet:
      'Mengapa sorghum menjadi kunci masa depan pertanian Indonesia di tengah perubahan iklim global. Kisah dari para petani lokal binaan BESTARI.',
    content:
      'Pertanian lokal memegang peranan krusial dalam menghadapi krisis iklim global. Sorghum, dengan daya tahannya yang luar biasa terhadap kekeringan dan lahan marjinal, menjadi pilar utama kedaulatan pangan di wilayah Indonesia Timur.\n\nMelalui kemitraan berkeadilan dengan para petani lokal di Flores dan Nusa Tenggara, BESTARI membina ratusan hektar lahan sorghum organik. Hasil panen yang stabil tidak hanya meningkatkan taraf hidup keluarga petani, tetapi juga menjamin ketersediaan bahan pangan bergizi tinggi secara berkelanjutan.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-U92ef1AWrRunC_1mYdC7EQH-yNArhPFBQ6oIdXQMm5M0Jy3PMHVPA29vpLt3JyBO5kmgn07CgjPENJcM4obBHNSZSOQSHfSDhYz_HD-Sd6i_AwP3C8h82A2jtXbTuq5AelCOPEliINBXjBJBUEr34MgWC3meRH8oWhEpCKWlR87CeaTLotYRfyLjVV0r3ch2LUsQ3HpICgyg3mEa8-RDYDyqj4LkKEbWN9VN3VNwmQeaednwsXf3Hg',
    date: '28 September 2023',
    author: 'Ahmad Subagyo',
    authorRole: 'Koordinator Petani Lokal',
  },
  {
    id: 'art-3',
    title: 'Inovasi Kuliner: Sorghum di Meja Makan Modern',
    category: 'Inspirasi',
    readTime: '6 Menit Baca',
    snippet:
      'Eksplorasi resep kreatif dari chef ternama yang menggunakan sorghum sebagai bintang utama dalam hidangan kontemporer yang menggugah selera.',
    content:
      'Sorghum tidak lagi terbatas pada olahan tradisional. Di tangan para profesional kuliner, biji-bijian ini diubah menjadi berbagai hidangan modern seperti risotto sorghum, gluten-free pasta, hingga dessert lezat.\n\nFlavour profile sorghum yang subtle dan sedikit \'nutty\' memberikan dimensi rasa baru yang diminati oleh para pecinta kuliner sehat maupun restoran fine dining.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDM3gs3-phAENScDeuisQGmk3iMEPfRWGM1tnPsGl2GrcuKF5fcxGlXrKDXn3Jzj8Oy0TVxdi-UXpD8gOOtQtuXctoYqXdnD78Fe9NUWzgtGa-iyJOMa0yDB2NG8CejhHfba11qTzv6myxY7F3PVm7Yq-gInGnsWh_FxgsgsxvOuveJ8YU9rDEoYhTL9i1QAC9RymUi91ztAF9c0qMYE1QcIi0pbnCtdNtMdW14xgHI_vSs8iJQeNlMqA',
    date: '15 September 2023',
    author: 'Chef Budi Santoso',
    authorRole: 'Culinary Specialist',
  },
  {
    id: 'art-4',
    title: 'Memahami Indeks Glikemik Rendah pada Sorghum',
    category: 'Nutrisi',
    readTime: '4 Menit Baca',
    snippet:
      'Penjelasan ilmiah mengenai mengapa sorghum sangat direkomendasikan bagi penderita diabetes dan mereka yang menjaga kadar gula darah.',
    content:
      'Indeks glikemik (GI) mengukur seberapa cepat karbohidrat dalam makanan meningkatkan kadar gula darah. Sorghum memiliki indeks glikemik tergolong rendah, sehingga dicerna secara perlahan dan melepaskan glukosa secara bertahap.\n\nHal ini menjadikan sorghum pilihan pangan ideal bagi individu yang mengelola diabetes melitus tipe 2 atau sedang menjalani program pemeliharaan berat badan ideal.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAh5o959jhbN3WAEQeFnpCBu3rXVlovo0i8uV_YZMoQSMfZrXwc6MNO1aoPP4RKAm1IPaxknmQagSnVSs5r_pO_bHrgnV3KYfCIQoeq0eHUye1GYQshy9xQa34RpNFex9deQAMHct3qs_d4vvkBT7HIIeMl08ueRRmNuJvgIkd_zy0yfGbBH5fy70xa_9JhRAm8M4tgEIGHCUGXKo5bf-_pY-h8dV94RLm808QVTcuDEM42TqGWdiXsKA',
    date: '02 September 2023',
    author: 'Dr. Rina Wati',
    authorRole: 'M.Gizi, Konsultan Nutrisi',
  },
  {
    id: 'art-5',
    title: 'Sorghum: Jejak Sejarah yang Terlupakan',
    category: 'Budidaya',
    readTime: '10 Menit Baca',
    snippet:
      'Menelusuri sejarah sorghum di nusantara, dari tanaman pangan utama hingga posisinya yang mulai kembali diperhitungkan dalam ekonomi modern.',
    content:
      'Sebelum maraknya dominasi beras di abad ke-20, sorghum atau cantel merupakan salah satu makanan pokok penting di banyak wilayah kering di Nusantara. Relief di candi Borobudur bahkan menggambarkan tanaman sorgum sebagai bagian dari kekayaan flora Nusantara.\n\nKini, revitalisasi sorghum membuka lembaran baru sejarah keanekaragaman pangan Indonesia.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB-5o9-XbQB38iqcCd5H7EzCbzBfIXEGXP06KKUq3h-Gr8wFzU4lS6kPoD5FGvrwAwrUe1riwP-DHEb8-Lytp58igCD6Nme-MOBtRMKiflVcvT6_d_oLlZfdX6Cx-kK7gOQillh1EubxF8O-9Vcq9236psgOUQp5lFhzYq-RIyb6M83Gylh0DKFCxRr-ckFrLjWu5Y5ALJvCLzdPfnVqBkD2JW513WVDAObk-9QggWi9fx2Gss4MXvoxA',
    date: '20 Agustus 2023',
    author: 'Tim Sejarah Bestari',
    authorRole: 'Peneliti Pangan Nusantara',
  },
  {
    id: 'art-6',
    title: 'Masa Depan Berkelanjutan dengan BESTARI',
    category: 'Inspirasi',
    readTime: '7 Menit Baca',
    snippet:
      'Bagaimana visi BESTARI dalam menciptakan ekosistem pangan yang tidak hanya sehat bagi konsumen, tetapi juga ramah bagi bumi.',
    content:
      'Inovasi pangan berkelanjutan adalah jantung dari pengembagan produk BESTARI. Dengan meminimalkan jejak karbon melalui rantai pasok lokal dan kemasan ramah lingkungan, kami memastikan setiap produk memberikan dampak positif bagi alam dan kesehatan.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD-9bJk2rqAziBbwuSlpCqsuLtRlnjmXr2kQNqbuxPxap-mpe-kwRkZ4geiGi0QAmDUaSuftNPX6faSuVhUmx6M1Iyynf-lIJkbJ7uTAMgJ1HF0hwOyfP9NuI4AfjIvCa-708ejAAUmGkRHqIUgfcYZKMmzyXhz2XBDCktAwsaE2uKP1n96Uce_RjwklTkI2PMzkEvvy3OXDHE7cm8AqXKKNLJvcHQY6Bv-lENnifdjN7m7hWK2Q_ojGA',
    date: '05 Agustus 2023',
    author: 'Redaksi Bestari',
    authorRole: 'Tim Keberlanjutan',
  },
];

export const articleApi = {
  getArticles: async (): Promise<Article[]> => {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return MOCK_ARTICLES;
  },

  getArticleById: async (id: string): Promise<Article | null> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return MOCK_ARTICLES.find((a) => a.id === id) || null;
  },
};
