const { default: axios } = require("axios");
const qrcode = require("qrcode-terminal");
const {
  Client,
  List,
  LocalAuth,
  Buttons,
  MessageMedia,
} = require("whatsapp-web.js");

const BASE_URL = "http://127.0.0.1:8000/api";

async function getLocations() {
  const { data } = await axios.get(BASE_URL + "/locations");
  let text = ``;
  let choice = [];
  let ids = [];
  data.forEach((element, index) => {
    text += `*${index + 1}. ${element.location_name}*\n`;
    choice.push((index + 1).toString());
    ids.push(element.id.toString());
  });
  return {
    ids: ids,
    data: text,
    choice: choice,
  };
}
async function getFloors(id) {
  const { data } = await axios.get(BASE_URL + "/floors/" + id);
  let text = ``;
  let choice = [];
  let ids = [];
  data.forEach((element, index) => {
    text += `*${index + 1}. ${element.floor_name}*\n`;
    choice.push((index + 1).toString());
    ids.push(element.id.toString());
  });
  return {
    ids: ids,
    data: text,
    choice: choice,
  };
}
async function getHouseTypes(id) {
  const { data } = await axios.get(BASE_URL + "/house_types/" + id);
  let text = ``;
  let choice = [];
  let ids = [];
  data.forEach((element, index) => {
    text += `*${index + 1}. ${element.house_types.house_type_name}*\n`;
    choice.push((index + 1).toString());
    ids.push(element.id.toString());
  });
  return {
    ids: ids,
    text: text,
    data: data,
    choice: choice,
  };
}
async function getSchemasAndDescriptions(id) {
  const { data } = await axios.get(
    BASE_URL + "/schemas_and_descriptions/" + id
  );
  return data;
}

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");

  // Objek JSON yang menggambarkan alur pertanyaan dan pilihan
  const objek_json = [
    {
      pertanyaan: "Apakah Anda ingin mencari rumah?",
      pilihan: [
        {
          teks: "Ya",
          pertanyaanSelanjutnya: {
            pertanyaan: "Silakan pilih lokasi:",
            pilihan: [
              {
                teks: "Jakarta",
                pertanyaanSelanjutnya: {
                  pertanyaan: "Pilih jenis rumah:",
                  pilihan: [
                    {
                      teks: "Rumah Mewah",
                      pertanyaanSelanjutnya: {
                        pertanyaan: "Pilih lantai:",
                        pilihan: [
                          {
                            teks: "Lantai 1",
                            pertanyaanSelanjutnya: {
                              gambar:
                                "https://example.com/gambar-rumah-mewah-lantai-1.jpg",
                              pertanyaan: "Pilih metode pembayaran:",
                            },
                          },
                          {
                            teks: "Lantai 2",
                            pertanyaanSelanjutnya: {
                              gambar:
                                "https://example.com/gambar-rumah-mewah-lantai-2.jpg",
                              pertanyaan: "Pilih metode pembayaran:",
                            },
                          },
                        ],
                      },
                    },
                    {
                      teks: "Rumah Sederhana",
                      pertanyaanSelanjutnya: {
                        pertanyaan: "Pilih lantai:",
                        pilihan: [
                          {
                            teks: "Lantai 1",
                            pertanyaanSelanjutnya: {
                              gambar:
                                "https://example.com/gambar-rumah-sederhana-lantai-1.jpg",
                              pertanyaan: "Pilih metode pembayaran:",
                            },
                          },
                          {
                            teks: "Lantai 2",
                            pertanyaanSelanjutnya: {
                              gambar:
                                "https://example.com/gambar-rumah-sederhana-lantai-2.jpg",
                              pertanyaan: "Pilih metode pembayaran:",
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                teks: "Bali",
                pertanyaanSelanjutnya: {
                  pertanyaan: "Pilih jenis rumah:",
                  pilihan: [
                    {
                      teks: "Villa",
                      pertanyaanSelanjutnya: {
                        pertanyaan: "Pilih lantai:",
                        pilihan: [
                          {
                            teks: "Lantai 1",
                            pertanyaanSelanjutnya: {
                              gambar:
                                "https://example.com/gambar-villa-lantai-1.jpg",
                              pertanyaan: "Pilih metode pembayaran:",
                            },
                          },
                          {
                            teks: "Lantai 2",
                            pertanyaanSelanjutnya: {
                              gambar:
                                "https://example.com/gambar-villa-lantai-2.jpg",
                              pertanyaan: "Pilih metode pembayaran:",
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          teks: "Tidak",
          jawaban: "Terima kasih, silakan hubungi kami",
        },
      ],
    },
  ];

  // Parsing objek JSON menjadi list pertanyaan
  const list_pertanyaan = objek_json;

  // Fungsi untuk menampilkan pertanyaan dan pilihan menggunakan tombol
  function tampilkan_pertanyaan(pertanyaan) {
    const buttons = pertanyaan.pilihan.map((pilihan, index) => {
      return new Buttons.TextButton({
        title: pilihan.teks,
        payload: index.toString(),
      });
    });

    const message = new Buttons.Message({
      contentText: pertanyaan.pertanyaan,
      footerText: "Pilih jawaban:",
      buttons: buttons,
    });

    client.sendMessage(message);
  }

  // Fungsi untuk menerima jawaban dari pengguna
  function terima_jawaban_dari_pengguna() {
    return new Promise((resolve) => {
      client.on("message", async (msg) => {
        const jawaban = msg.body;
        resolve(jawaban);
      });
    });
  }

  // Fungsi untuk menampilkan jawaban
  function tampilkan_jawaban(jawaban) {
    client.sendMessage(jawaban);
  }

  function welcomeMessage() {
    return `Halo, Kami dari Ahsana Tuban, Apakah anda sedang mencari rumah ?\nBalas *Ya* jika anda mencari rumah, balasa *Tidak* jika tidak sedang mencari rumah.
    `;
  }

  // Fungsi untuk menjalankan bot
  async function bot(pertanyaan) {
    tampilkan_pertanyaan(pertanyaan);

    const jawaban = await terima_jawaban_dari_pengguna();

    const jawabanIndex = parseInt(jawaban);
    if (
      pertanyaan.pilihan[jawabanIndex] &&
      pertanyaan.pilihan[jawabanIndex].pertanyaanSelanjutnya
    ) {
      bot(pertanyaan.pilihan[jawabanIndex].pertanyaanSelanjutnya);
    } else {
      tampilkan_jawaban(pertanyaan.pilihan[jawabanIndex].jawaban);
    }
  }
  let isStart = true;
  let locationSelected = false;
  let floorSelected = false;
  let typeSelected = false;
  let isReallyExcited = false;

  // session
  let floorSession = [];
  let floorIDSelected;
  let houseTypeSession = [];
  let houseTypeIDSelected;

  client.on("message", async (message) => {
    if (isStart) {
      const text = message.body.toLowerCase();

      // Menangkap kata apa pun dari pengguna
      const regex = /(\w+)/g;
      const matches = text.match(regex);

      if (matches) {
        await client.sendMessage(message.from, welcomeMessage());
      }
      isStart = false;
    } else {
      let isExcited = true;
      if (isExcited) {
        if (message.body == "Ya" || message.body == "ya" || isExcited) {
          const location = await getLocations();
          if (!locationSelected) {
            await client.sendMessage(
              message.from,
              `Baiklah kami sedang ada beberapa perumahan di berbagai daerah. Silahkan pilih lokasi berikut \n${location.data}
              `
            );
            locationSelected = true;
          } else {
            if (!floorSelected) {
              if (location.choice.includes(message.body)) {
                let floors = await getFloors(
                  location.ids[parseInt(message.body - 1)]
                );
                await client.sendMessage(
                  message.from,
                  `Berikut adalah daftar lantai yang tersedia:\n${floors.data}`
                );
                floorSession = floors;
                floorIDSelected = floors.ids[parseInt(message.body - 1)];
                floorSelected = true;
              } else {
                await client.sendMessage(
                  message.from,
                  `Maaf pilihan tidak tersedia. Mohon pilih sesuai angka yang tersedia.\nBerikut adalah daftar lantai yang tersedia:\n${location.data}`
                );
              }
            } else {
              if (!typeSelected) {
                if (floorSession.choice.includes(message.body)) {
                  let house_type = await getHouseTypes(floorIDSelected);
                  houseTypeSession = house_type;
                  houseTypeIDSelected =
                    house_type.ids[parseInt(message.body - 1)];

                  await client.sendMessage(
                    message.from,
                    `Berikut adalah daftar tipe yang tersedia:\n`
                  );
                  for (let i = 0; i < house_type.data.length; i++) {
                    await client.sendMessage(
                      message.from,
                      `${i + 1}. ${
                        house_type.data[i].house_types.house_type_name
                      }`
                    );
                    for (
                      let j = 0;
                      j < house_type.data[i].house_types.image.length;
                      j++
                    ) {
                      await client.sendMessage(
                        message.from,
                        await MessageMedia.fromUrl(
                          house_type.data[i].house_types.image[j]
                        )
                      );
                    }
                  }
                  await client.sendMessage(
                    message.from,
                    `Silahkan masukan pilihan anda :\n${house_type.text}`
                  );
                  typeSelected = true;
                } else {
                  let floor_repeat = await getFloors(floorIDSelected);
                  await client.sendMessage(
                    message.from,
                    `Maaf pilihan tidak tersedia. Mohon pilih sesuai angka yang tersedia.\nBerikut adalah daftar lantai yang tersedia:\n${floor_repeat.data}`
                  );
                }
              } else {
                if (!isReallyExcited) {
                  if (houseTypeSession.choice.includes(message.body)) {
                    let schemas_and_descriptions =
                      await getSchemasAndDescriptions(houseTypeIDSelected);

                    await client.sendMessage(
                      message.from,
                      `Kami ingin menjelaskan tentang skema yang kami tawarkan, yaitu "Tanpa Bank, Tanpa Sita, Tanpa Denda, dan Tanpa Bunga." Skema ini dirancang untuk memberikan solusi finansial yang mudah, tanpa melibatkan bank, risiko sita, denda, atau biaya bunga.\n✅ Tanpa Bank: Tidak ada keterlibatan bank. Jadi, Anda tidak perlu repot mengurus pinjaman atau membayar bunga kepada pihak bank. Kami ingin memberikan pengalaman yang sederhana dan cepat tanpa melibatkan prosedur bank yang rumit.\n❌ Tanpa Sita: Kami tidak akan melakukan penyitaan aset. Jadi, Anda tidak perlu khawatir kehilangan atau pengambilalihan aset Anda. Kami ingin memastikan bahwa Anda tetap memiliki kendali penuh atas aset Anda tanpa risiko sita.\n🚫 Tanpa Denda: Tidak ada risiko denda dalam skema kami. Kami mengerti bahwa dalam situasi keuangan sulit, denda hanya akan membebani Anda lebih lanjut. Kami ingin memberikan solusi yang membantu mengurangi beban finansial Anda tanpa menambahkan masalah baru.\n💰 Tanpa Bunga: Keunggulan utama skema kami adalah tidak ada biaya bunga yang dikenakan. Artinya, Anda tidak perlu membayar biaya tambahan berdasarkan tingkat suku bunga seperti dalam pinjaman tradisional. Kami ingin memberikan solusi finansial yang terjangkau dan adil tanpa beban bunga yang berlebihan.\nDengan skema "Tanpa Bank, Tanpa Sita, Tanpa Denda, dan Tanpa Bunga" kami, kami bertujuan untuk memberikan solusi finansial yang mudah dimengerti, cepat, dan adil. Kami siap membantu Anda melewati situasi keuangan sulit dengan pilihan yang sesuai dengan kebutuhan dan preferensi Anda.`
                    );

                    await client.sendMessage(
                      message.from,
                      `Untuk tipe rumah yang anda pilih : \n`
                    );
                    schemas_and_descriptions.house_floor_type_payments.forEach(
                      async (element, index) => {
                        await client.sendMessage(
                          message.from,
                          `*${element.payment_type}*\n${element.descriptions}`
                        );
                      }
                    );
                  } else {
                    let house_type_repeat = await getHouseTypes(
                      floorIDSelected
                    );
                    await client.sendMessage(
                      message.from,
                      `Maaf pilihan tidak tersedia. Mohon pilih sesuai angka yang tersedia.\nBerikut adalah daftar tipe rumah yang tersedia:\n${house_type_repeat.text}`
                    );
                  }
                }
              }
            }
          }
        } else if (message.body == "Tidak" || message.body == "tidak") {
          await client.sendMessage(
            message.from,
            "Baik, Terimakasih atas jawaban anda. Selamat melanjutkan aktifitas anda kembali"
          );
          isStart = true;
        } else {
          console.log("masuk sini");
        }
      }
    }

    // const productsList = new List(
    //   "Here's our list of products at 50% off",
    //   "View all products",
    //   [
    //     {
    //       title: "Products list",
    //       rows: [
    //         { id: "apple", title: "Apple" },
    //         { id: "mango", title: "Mango" },
    //         { id: "banana", title: "Banana" },
    //       ],
    //     },
    //   ],
    //   "Please select a product"
    // );
    //   console.log(productsList);
    // const buttonMessage = new Buttons(
    //   "Ini body",
    //   [
    //     { id: "customId", body: "button1" },
    //     { body: "button2" },
    //     { body: "button3" },
    //     { body: "button4" },
    //   ],
    //   "Footer",
    //   "Title"
    // );
    // const media = await MessageMedia.fromUrl(
    //   "https://via.placeholder.com/350x150.png"
    // );
    // const media2 = await MessageMedia.fromUrl(
    //   "https://via.placeholder.com/450x250.png"
    // );
    // await client.sendMessage(message.from, media);
    // await client.sendMessage(message.from, media2);
  });
});

client.initialize();
