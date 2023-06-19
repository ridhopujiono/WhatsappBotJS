const { default: axios } = require("axios");
const qrcode = require("qrcode-terminal");
var qrcode_gui = require("qrcode");

const {
  Client,
  List,
  LocalAuth,
  Buttons,
  MessageMedia,
} = require("whatsapp-web.js");

const BASE_URL = "http://127.0.0.1:8000/api";

// Menyimpan status dan riwayat obrolan pengguna
const userStatus = {};

// Fungsi untuk mendapatkan status pengguna
function getUserStatus(userId) {
  if (!userStatus[userId]) {
    // Buat entri baru untuk pengguna yang belum ada status
    userStatus[userId] = {
      isStart: false,
      nextExcited: false,
      nextExcitedAnswer: false,
      nextExcitedWant: false,
      isExcited: false,
      isLocationSelected: false,
      isFloorSelected: false,
      isHouseTypeSelected: false,
      isSchemaSelected: false,
      isMinat: false,
      locationSession: [],
      floorSession: [],
      houseTypeSession: [],
      // Tambahkan properti status pengguna lainnya di sini
    };
  }
  return userStatus[userId];
}

// Fungsi untuk mereset status pengguna
function resetUserStatus(userId, needWelcoming) {
  userStatus[userId] = {
    isFilled: false,
    isFloorFilled: false,
    isHouseTypeFilled: false,
    isSchemaFilled: false,
    isMinatFilled: false,
    isStart: false,
    nextExcited: false,
    nextExcitedAnswer: false,
    nextExcitedWant: false,
    isExcited: false,
    isLocationSelected: false,
    isFloorSelected: false,
    isHouseTypeSelected: false,
    isSchemaSelected: false,
    isMinat: false,
    // Tambahkan properti status pengguna lainnya di sini
  };

  if (needWelcoming) {
    // Kirim pesan sambutan jika diperlukan
    const welcomeMessage = `Halo! 👋 Kami dari Ahsana Tuban ingin mengenal Anda. Apakah Anda saat ini sedang mencari rumah ?\n\nBalas *Ya* jika Anda sedang mencari rumah.\n\nBalas *Tidak* jika Anda tidak sedang mencari rumah.\n\nTerima kasih! 🏠.`;
    client.sendMessage(userId, welcomeMessage);
    userStatus[userId].isStart = true;
  }
}

let numberOfTopMenu = 99;
function choiceToTop() {
  return `*${numberOfTopMenu}. Menu awal*`;
}

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
function welcomeMessage() {
  return `Halo! 👋 Kami dari Ahsana Tuban ingin mengenal Anda. Apakah Anda saat ini sedang mencari rumah ?\n\nBalas *Ya* jika Anda sedang mencari rumah.\n\nBalas *Tidak* jika Anda tidak sedang mencari rumah.\n\nTerima kasih! 🏠.
        `;
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
const initializeClient = () => {
  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    qrcode_gui.toFile("./qrcode.png", qr);
  });

  client.on("ready", () => {
    console.log("Client is ready!");

    client.on("message", async (message) => {
      const userId = message.from;
      try {
        // Mendapatkan status pengguna
        const user = getUserStatus(userId);

        // Mendapatkan status dan riwayat obrolan pengguna

        if (!userStatus[userId].isStart) {
          const text = message.body.toLowerCase();
          // Menangkap kata apa pun dari pengguna
          const regex = /(\w+)/g;
          const matches = text.match(regex);
          if (matches) {
            await client.sendMessage(userId, welcomeMessage());
          }
          userStatus[userId].isStart = true;
        } else {
          if (!userStatus[userId].isExcited) {
            if (message.body.toLowerCase() == "ya") {
              // lanjut iya
              userStatus[userId].locationSession = await getLocations();
              await client.sendMessage(
                userId,
                `Terimakasih atas jawabanya. Kebetulan sekali kami memiliki beberapa titik lokasi perumahan yang tersedia :\n\n${
                  userStatus[userId].locationSession.data
                }${choiceToTop()}\n\nApabila Anda tertarik dengan salah satu lokasi di atas, harap beri tahu kami nomor pilihan Anda.\n\nTerima kasih! 🏡`
              );
              userStatus[userId].isExcited = true;
              userStatus[userId].nextExcited = true;
              userStatus[userId].isLocationSelected = false;
              userStatus[userId].isFloorSelected = false;
              userStatus[userId].isHouseTypeSelected = false;
              userStatus[userId].isSchemaSelected = false;
              userStatus[userId].isMinat = true;

              userStatus[userId].isFilled = true;
            } else if (message.body.toLowerCase() == "tidak") {
              // lanjut tidak
              userStatus[userId].isExcited = false;
              userStatus[userId].nextExcited = false; // untuk next ke pertanyaan selanjutnya karena "tidak"
              userStatus[userId].isLocationSelected = true;
              userStatus[userId].isFloorSelected = true;
              userStatus[userId].isHouseTypeSelected = true;
              userStatus[userId].isSchemaSelected = true;
              userStatus[userId].isMinat = true;
            } else {
              await client.sendMessage(
                userId,
                `Maaf pilihan tidak tersedia.\n\nBalas *Ya* jika Anda sedang mencari rumah\nBalas *Tidak* jika Anda tidak sedang mencari rumah`
              );
              // salah
              userStatus[userId].isExcited = false;
              userStatus[userId].nextExcited = true;
              userStatus[userId].isLocationSelected = true;
              userStatus[userId].isFloorSelected = true;
              userStatus[userId].isHouseTypeSelected = true;
              userStatus[userId].isSchemaSelected = true;
              userStatus[userId].isMinat = true;
            }
          }
          //   NOT EXCITED
          if (!userStatus[userId].nextExcited) {
            await client.sendMessage(
              userId,
              `Baik apakah anda tertarik dengan layanan kami lainya ? \n\n1. Ruko\n2. Tanah 3. Tidak keduanya`
            );
            userStatus[userId].nextExcited = true; // untuk next kepertanyaan selanjutnya
            userStatus[userId].isExcited = true;
            userStatus[userId].nextExcitedAnswer = true;
          } else {
            if (userStatus[userId].nextExcitedAnswer) {
              if (message.body.toLowerCase() == "3") {
                await client.sendMessage(
                  userId,
                  `Mohon tuliskan anda tertarik pada apa`
                );
                userStatus[userId].nextExcitedWant = true;
                userStatus[userId].nextExcitedAnswer = false;
                userStatus[userId].nextExcited = true; // true karena akan di cek lagi
                userStatus[userId].isLocationSelected = true;
                userStatus[userId].isFloorSelected = true;
                userStatus[userId].isHouseTypeSelected = true;
                userStatus[userId].isSchemaSelected = true;
                userStatus[userId].isMinat = true;
              } else {
                if (message.body.toLowerCase() == "1") {
                  await client.sendMessage(
                    userId,
                    `Baik anda akan kami kabari untuk next project. Terimakasih`
                  );
                  await resetUserStatus(userId, false);
                  userStatus[userId].nextExcitedAnswer = false;
                  console.log("reset 192");

                  userStatus[userId].isLocationSelected = true;
                  userStatus[userId].isFloorSelected = true;
                  userStatus[userId].isHouseTypeSelected = true;
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                } else if (message.body.toLowerCase() == "2") {
                  await client.sendMessage(
                    userId,
                    `Baik anda akan kami kabari untuk next project. Terimakasih`
                  );
                  await resetUserStatus(userId, false);
                  userStatus[userId].nextExcitedAnswer = false;

                  userStatus[userId].isLocationSelected = true;
                  userStatus[userId].isFloorSelected = true;
                  userStatus[userId].isHouseTypeSelected = true;
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                } else {
                  await client.sendMessage(
                    userId,
                    `Maaf pilihan tidak tersedia. Silahkan pilih layanan kami lainya ? \n\n1. Ruko\n2. Tanah 3. Tidak keduanya `
                  );
                  userStatus[userId].nextExcitedAnswer = true;
                }
              }
            } else {
              if (userStatus[userId].nextExcitedWant) {
                await client.sendMessage(
                  userId,
                  `Baik anda akan kami kabari tentang *${message.body}* untuk next project. Terimakasih`
                );
                userStatus[userId].nextExcitedWant = false;
                await resetUserStatus(userId, false);
                console.log("Baris 217 reset");
                userStatus[userId].isLocationSelected = true; // true karena menghindari userStatus[userId].isLocationSelected
                userStatus[userId].isLocationSelected = true;
                userStatus[userId].isFloorSelected = true;
                userStatus[userId].isHouseTypeSelected = true;
                userStatus[userId].isSchemaSelected = true;
                userStatus[userId].isMinat = true;
              }
            }
          }
          // NOT EXCITED
          //   EXCITED
          console.log(
            "userStatus[userId].isLocationSelected : ",
            userStatus[userId].isLocationSelected
          );
          console.log(
            "userStatus[userId].isFilled : ",
            userStatus[userId].isFilled
          );
          console.log(
            "userStatus[userId].isFloorSelected : ",
            userStatus[userId].isFloorSelected
          );
          if (!userStatus[userId].isLocationSelected) {
            if (!userStatus[userId].isFilled) {
              if (
                userStatus[userId].locationSession.choice.includes(message.body)
              ) {
                userStatus[userId].floorSession = await getFloors(
                  userStatus[userId].locationSession.ids[
                    parseInt(message.body - 1)
                  ]
                );
                userStatus[userId].floorIDSelected =
                  userStatus[userId].floorSession.ids[
                    parseInt(message.body - 1)
                  ];
                await client.sendMessage(
                  userId,
                  `Terimakasih telah memilih titik lokasi. Berikut adalah lantai yang tersedia di titik lokasi:\n\n${
                    userStatus[userId].floorSession.data
                  }${choiceToTop()}\n\nJika Anda tertarik dengan salah satu lantai di atas, harap beri tahu kami nomor pilihan yang menjadi pilihan Anda\n\nTerimakasih!🏡`
                );
                //   di skip karena sudah benar
                userStatus[userId].isLocationSelected = true;
                userStatus[userId].isFloorSelected = false;
              } else {
                if (message.body == numberOfTopMenu) {
                  console.log("Baris 317 reset");
                  await resetUserStatus(userId, true);
                } else {
                  console.log("masuk 265");
                  await client.sendMessage(
                    userId,
                    `Maaf nomor pilihan tidak tersedia. Mohon pilih sesuai nomor yang tersedia.\nBerikut adalah daftar lokasi yang tersedia:\n${
                      userStatus[userId].locationSession.data
                    }${choiceToTop()}`
                  );
                }
                // di ulang karena salah
              }
              userStatus[userId].isFloorFilled = true;
            } else {
              userStatus[userId].isFilled = false;
            }
            userStatus[userId].isFloorFilled = true;
          }
          console.log(
            "userStatus[userId].isFloorSelected : ",
            userStatus[userId].isFloorSelected
          );
          console.log(
            "userStatus[userId].isFloorFilled : ",
            userStatus[userId].isFloorFilled
          );
          if (!userStatus[userId].isFloorSelected) {
            if (!userStatus[userId].isFloorFilled) {
              if (
                userStatus[userId].floorSession.choice.includes(message.body)
              ) {
                userStatus[userId].houseTypeSession = await getHouseTypes(
                  userStatus[userId].floorIDSelected
                );
                userStatus[userId].houseTypeIDSelected =
                  userStatus[userId].houseTypeSession.ids[
                    parseInt(message.body - 1)
                  ];

                for (
                  let i = 0;
                  i < userStatus[userId].houseTypeSession.data.length;
                  i++
                ) {
                  await client.sendMessage(
                    userId,
                    `${i + 1}. ${
                      userStatus[userId].houseTypeSession.data[i].house_types
                        .house_type_name
                    }`
                  );
                  for (
                    let j = 0;
                    j <
                    userStatus[userId].houseTypeSession.data[i].house_types
                      .image.length;
                    j++
                  ) {
                    await client.sendMessage(
                      userId,
                      await MessageMedia.fromUrl(
                        userStatus[userId].houseTypeSession.data[i].house_types
                          .image[j]
                      )
                    );
                  }
                }
                await client.sendMessage(
                  userId,
                  `Silakan masukkan nomor pilihan Anda berdasarkan tipe rumah yang Anda inginkan. :\n${
                    userStatus[userId].houseTypeSession.text
                  }${choiceToTop()}\n\nTerimakasih!🏡`
                );

                userStatus[userId].isFloorSelected = true;
              } else {
                // salah
                if (message.body == numberOfTopMenu) {
                  console.log("Baris 338 reset");
                  await resetUserStatus(userId, true);
                } else {
                  console.log("masuk 241");
                  await client.sendMessage(
                    userId,
                    `Maaf nomor pilihan tidak tersedia. Mohon pilih sesuai nomor yang tersedia.\nBerikut adalah daftar lantai yang tersedia:\n${
                      userStatus[userId].floorSession.data
                    }${choiceToTop()}`
                  );
                  userStatus[userId].isHouseTypeSelected = false;
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                }
                userStatus[userId].isFloorSelected = false;
              }
            } else {
              console.log("Baris 353");
              userStatus[userId].isFloorFilled = false;
            }
            userStatus[userId].isHouseTypeFilled = true;
          }
          if (!userStatus[userId].isHouseTypeSelected) {
            if (!userStatus[userId].isHouseTypeFilled) {
              if (
                userStatus[userId].houseTypeSession.choice.includes(
                  message.body
                )
              ) {
                await client.sendMessage(
                  userId,
                  `Kami ada 3 skema pembayaran. Mohon pilih skema pembayaran berikut: \n\n*1. Cash* \n*2. Credit*\n*3. Tempo*\n${choiceToTop()}`
                );

                userStatus[userId].isHouseTypeSelected = true;
                userStatus[userId].isSchemaSelected = false;
              } else {
                if (message.body == numberOfTopMenu) {
                  console.log("Baris 435 reset");
                  await resetUserStatus(userId, true);
                } else {
                  await client.sendMessage(
                    message.from,
                    `Maaf nomor pilihan tidak tersedia. Mohon pilih sesuai nomor yang tersedia.\nBerikut adalah daftar tipe rumah yang tersedia:\n${
                      userStatus[userId].houseTypeSession.text
                    }${choiceToTop()}`
                  );
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                }
                userStatus[userId].isHouseTypeSelected = false;
              }
            } else {
              userStatus[userId].isHouseTypeFilled = false;
            }
            userStatus[userId].isSchemaFilled = true;
          }
          console.log(
            "userStatus[userId].isSchemaSelected : ",
            userStatus[userId].isSchemaSelected
          );
          if (!userStatus[userId].isSchemaSelected) {
            if (!userStatus[userId].isSchemaFilled) {
              if (["1", "2", "3"].includes(message.body)) {
                userStatus[userId].schemaSession =
                  await getSchemasAndDescriptions(
                    userStatus[userId].houseTypeIDSelected
                  );

                if (message.body == "1") {
                  userStatus[userId].selectedPayment = userStatus[
                    userId
                  ].schemaSession.house_floor_type_payments.find(
                    (payment) => payment.payment_type == "cash"
                  );
                  await client.sendMessage(
                    userId,
                    userStatus[userId].selectedPayment.descriptions
                  );
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                } else if (message.body == "2") {
                  userStatus[userId].selectedPayment = userStatus[
                    userId
                  ].schemaSession.house_floor_type_payments.find(
                    (payment) => payment.payment_type == "credit"
                  );
                  await client.sendMessage(
                    userId,
                    userStatus[userId].selectedPayment.descriptions
                  );
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                } else if (message.body == "3") {
                  userStatus[userId].selectedPayment = userStatus[
                    userId
                  ].schemaSession.house_floor_type_payments.find(
                    (payment) => payment.payment_type == "tempo"
                  );
                  await client.sendMessage(
                    userId,
                    userStatus[userId].selectedPayment.descriptions
                  );
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                }

                await client.sendMessage(
                  userId,
                  `Apakah anda berminat ? \n\nBalas *Minat* jika berminat\nBalas *Kurang minat* jika kurang berminat`
                );

                userStatus[userId].isMinat = true;
                userStatus[userId].isMinatFilled = true;
              } else {
                if (message.body == numberOfTopMenu) {
                  await resetUserStatus(userId, true);
                } else {
                  await client.sendMessage(
                    userId,
                    `Pilihan tidak tersedia, mohon masukan angka yang benar`
                  );
                  userStatus[userId].isSchemaSelected = false;
                }

                // salah
                isSchemaSelected = false;
              }
            } else {
              userStatus[userId].isSchemaFilled = false;
            }
          }
          console.log(
            "userStatus[userId].isMinat :",
            userStatus[userId].isMinat
          );
          if (!userStatus[userId].isMinat) {
            if (!userStatus[userId].isMinatFilled) {
              if (message.body.toLowerCase() == "minat") {
                // lanjut iya
                await client.sendMessage(message.from, "minat");
                userStatus[userId].isMinat = true;
              } else if (message.body.toLowerCase() == "kurang minat") {
                // lanjut tidak
                await client.sendMessage(message.from, "kurang minat");
                userStatus[userId].isMinat = true;
              } else {
                // salah
                await client.sendMessage(message.from, "tidak ada");
                userStatus[userId].isMinat = false;
              }
            } else {
              userStatus[userId].isMinatFilled = false;
            }
          }
          // EXCITED
        }
      } catch (error) {
        console.log(error);
        await client.sendMessage(
          userId,
          `Sepertinya ada error dalam sisi server. Kami akan kembali lagi dalam beberapa menit`
        );
        await resetUserStatus(userId, true);
      }
    });
  });
  client.initialize();
};

initializeClient();
