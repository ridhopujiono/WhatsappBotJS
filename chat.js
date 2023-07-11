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

const BASE_URL = "https://ahsanatuban.com/dashboard-bot/api";

// Menyimpan status dan riwayat obrolan pengguna
const userStatus = {};

// Fungsi untuk mereset status pengguna
function resetUserStatus(userId, needWelcoming) {
  userStatus[userId] = {
    isFilled: false,
    isFloorFilled: true,
    isHouseTypeFilled: true,
    isSchemaFilled: true,
    isMinatFilled: true,
    isMinatTrueFilled: true,
    isMinatFalseFilled: true,
    isMitraLocationSelectedFilled: true,
    isHaveProblemFilled: true,
    isProjectStart: false,
    nextExcited: false,
    nextExcitedAnswer: false,
    nextExcitedWant: false,
    isExcited: false,
    isLocationSelected: false,
    isFloorSelected: false,
    isHouseTypeSelected: false,
    isSchemaSelected: false,
    isMinat: false,
    isMinatTrue: false,
    isMinatFalse: false,
    isMitraLocationSelected: false,
    isHaveProblem: false,
    // Tambahkan properti status pengguna lainnya di sini
  };

  if (needWelcoming) {
    // Kirim pesan sambutan jika diperlukan
    const welcomeMessage = `Halo! \nMakasih ya sudah menghubungi Tim Ahsana.\nSebelum memulai, kami ingin tahu apakah kamu sedang cari rumah?\n\n1. Ya\n2. Tidak\n0. Kembali Menu awal\n\nSilahkan ketikan angka sesuai pilihan kamu ☺️`;
    client.sendMessage(userId, welcomeMessage);
    userStatus[userId].isProjectStart = true;
  }
}

let numberOfTopMenu = "99";
function choiceToTop() {
  return `\nBelum tertarik? \nKetik: 99 Untuk kembali ke Menu Proyek`;
}

async function getCustomMenus() {
  const { data } = await axios.get(BASE_URL + "/custom_menu");
  return data;
}
async function getCustomMenuById(id) {
  const { data } = await axios.get(BASE_URL + "/custom_menu/" + id);
  return data;
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
async function getLocationById(id) {
  const { data } = await axios.get(BASE_URL + "/locations/" + id);
  return data;
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
async function postUrgentProject(
  id,
  urgent_type,
  payment_type,
  follow_up,
  phone_number
) {
  const { data } = await axios.post(BASE_URL + "/urgent_project/" + id, {
    urgent_type: urgent_type,
    payment_type: payment_type,
    follow_up: follow_up,
    phone_number: phone_number,
  });
}
async function postNextProject(type, descriptions, phone_number) {
  const { data } = await axios.post(BASE_URL + "/next_project", {
    type: type,
    descriptions: descriptions,
    phone_number: phone_number,
  });
  return data;
}
function welcomeMessage() {
  return `Halo! \nMakasih ya sudah menghubungi Tim Ahsana.\nSebelum memulai, kami ingin tahu apakah kamu sedang cari rumah?\n\n1. Ya\n2. Tidak\n0. Kembali Menu awal\n\nSilahkan ketikan angka sesuai pilihan kamu ☺️`;
}

async function startCustomMenu() {
  let data = await getCustomMenus();
  let text = ``;
  let choice = [];
  let ids = [];
  let i = 0;
  text += `Halo! \nMakasih ya sudah menghubungi Tim Ahsana. Apa yang sedang anda cari ?\n\n`;
  data.forEach((element, index) => {
    i = index + 1;
    text += `*${index + 1}. ${element.name}*\n`;
    choice.push((index + 1).toString());
    ids.push(element.id.toString());
  });
  choice.push((i + 1).toString());
  text += `*${i + 1}. Proyek Ahsana*\n`;
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
const initializeClient = () => {
  client.on("qr", (qr) => {
    console.log("Jika muncul QR Code tolong scan dahulu!");
    qrcode.generate(qr, { small: true });
    qrcode_gui.toFile("./qrcode.png", qr);
  });

  client.on("ready", () => {
    console.log("Aplikasi berjalan dan siap dipakai!");

    client.on("message", async (message) => {
      const userId = message.from;

      // Memastikan objek userStatus[userId] sudah didefinisikan
      if (!userStatus[userId]) {
        userStatus[userId] = {};
      }

      userStatus[userId].messageBody = message.body;
      userStatus[userId].menu = await startCustomMenu();
      try {
        if (!userStatus[userId].isStart) {
          let text = userStatus[userId].messageBody.toLowerCase();
          // Menangkap kata apa pun dari pengguna
          let regex = /(\w+)/g;
          let matches = text.match(regex);
          if (matches) {
            await client.sendMessage(userId, userStatus[userId].menu.text);
          }
          userStatus[userId].isStart = true;
        } else {
          if (!userStatus[userId].isMenuShown) {
            if (
              userStatus[userId].menu.choice.includes(
                userStatus[userId].messageBody
              )
            ) {
              userStatus[userId].isStart = true;
              userStatus[userId].isMenuShown = true;

              userStatus[userId].isMenuSelected = false;
              userStatus[userId].isProjectStart = false;
            } else {
              await client.sendMessage(
                userId,
                `Maaf pilihan tidak tersedia.\nSilahkan ketikan angka sesuai pilihan kamu ☺️`
              );
              userStatus[userId].isMenuSelected = true;
              userStatus[userId].isProjectStart = false;
            }
          }

          if (!userStatus[userId].isMenuSelected) {
            if (
              userStatus[userId].messageBody ==
              userStatus[userId].menu.choice[
                userStatus[userId].menu.choice.length - 1
              ]
            ) {
              userStatus[userId].isMenuSelected = true;
              userStatus[userId].isProjectStart = true;
            } else {
              userStatus[userId].detailMenu = await getCustomMenuById(
                userStatus[userId].menu.ids[
                  parseInt(userStatus[userId].messageBody - 1)
                ]
              );
              await client.sendMessage(
                userId,
                userStatus[userId].detailMenu.text
              );
              if (userStatus[userId].detailMenu.image !== null) {
                for (
                  let i = 0;
                  i < userStatus[userId].detailMenu.image.length;
                  i++
                ) {
                  await client.sendMessage(
                    userId,
                    await MessageMedia.fromUrl(
                      userStatus[userId].detailMenu.image[i],
                      {
                        unsafeMime: true,
                      }
                    )
                  );
                }
              }

              userStatus[userId].isMenuSelected = false;
              userStatus[userId].isStart = false;
              userStatus[userId].isMenuShown = false;
            }
          }

          if (userStatus[userId].isProjectStart) {
            await client.sendMessage(userId, welcomeMessage());
            userStatus[userId].isProjectStart = false;
            userStatus[userId].isProjectStart2 = true;
          } else {
            if (userStatus[userId].isProjectStart2) {
              userStatus[userId].phone_number = userId;

              if (!userStatus[userId].isExcited) {
                if (userStatus[userId].messageBody.toLowerCase() == "1") {
                  // lanjut iya
                  userStatus[userId].locationSession = await getLocations();
                  await client.sendMessage(
                    userId,
                    `Wah pas banget nih, kami punya proyek aktif yang mungkin cocok untuk kamu. \nKetik nomor proyek yang ingin kamu cari tahu ya!:\n\n${
                      userStatus[userId].locationSession.data
                    }${choiceToTop()}`
                  );
                  userStatus[userId].isExcited = true;
                  userStatus[userId].nextExcited = true;
                  userStatus[userId].isLocationSelected = false;
                  userStatus[userId].isFloorSelected = false;
                  userStatus[userId].isHouseTypeSelected = false;
                  userStatus[userId].isSchemaSelected = false;
                  userStatus[userId].isMinat = true;
                  userStatus[userId].isMinatTrue = true;
                  userStatus[userId].isMinatFalse = true;
                  userStatus[userId].isMitraLocationSelected = true;
                  userStatus[userId].isHaveProblem = true;

                  userStatus[userId].isFilled = true;
                } else if (
                  userStatus[userId].messageBody.toLowerCase() == "2"
                ) {
                  // lanjut tidak
                  userStatus[userId].isExcited = false;
                  userStatus[userId].nextExcited = false; // untuk next ke pertanyaan selanjutnya karena "tidak"
                  userStatus[userId].isLocationSelected = true;
                  userStatus[userId].isFloorSelected = true;
                  userStatus[userId].isHouseTypeSelected = true;
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                  userStatus[userId].isMinatTrue = true;
                  userStatus[userId].isMinatFalse = true;
                  userStatus[userId].isMitraLocationSelected = true;
                  userStatus[userId].isHaveProblem = true;
                } else if (
                  userStatus[userId].messageBody.toLowerCase() == "0"
                ) {
                  userStatus[userId].isProjectStart = true;
                  userStatus[userId].isProjectStart2 = true;
                  userStatus[userId].isMenuSelected = false;
                  userStatus[userId].isMenuShown = false;

                  await resetUserStatus(userId, false);
                  userStatus[userId].isStart = true;
                  userStatus[userId].menu = await startCustomMenu();
                  await client.sendMessage(
                    userId,
                    userStatus[userId].menu.text
                  );
                  return;
                } else {
                  await client.sendMessage(
                    userId,
                    `Maaf pilihan tidak tersedia.\n\n1. Ya\n2. Tidak\n\nSilahkan ketikan angka sesuai pilihan kamu ☺️`
                  );
                  // salah
                  userStatus[userId].isExcited = false;
                  userStatus[userId].nextExcited = true;
                  userStatus[userId].isLocationSelected = true;
                  userStatus[userId].isFloorSelected = true;
                  userStatus[userId].isHouseTypeSelected = true;
                  userStatus[userId].isSchemaSelected = true;
                  userStatus[userId].isMinat = true;
                  userStatus[userId].isMinatTrue = true;
                  userStatus[userId].isMinatFalse = true;
                  userStatus[userId].isMitraLocationSelected = true;
                  userStatus[userId].isHaveProblem = true;
                }
              }

              //   NOT EXCITED
              if (!userStatus[userId].nextExcited) {
                await client.sendMessage(
                  userId,
                  `Apakah Kamu saat ini sedang mencari produk berikut ?\n\n1. Ruko\n2. Tanah\n3. Tidak minat kedua produk diatas\n99. Kembali ke Menu Awal`
                );
                userStatus[userId].nextExcited = true; // untuk next kepertanyaan selanjutnya
                userStatus[userId].isExcited = true;
                userStatus[userId].nextExcitedAnswer = true;
              } else {
                if (userStatus[userId].nextExcitedAnswer) {
                  if (userStatus[userId].messageBody.toLowerCase() == "3") {
                    await client.sendMessage(
                      userId,
                      `Mohon tuliskan kamu tertarik apa`
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
                    if (userStatus[userId].messageBody.toLowerCase() == "1") {
                      await client.sendMessage(
                        userId,
                        `Terimakasih telah menghubungi kami.\nNext kalau misal kami ada penawaran menarik akan segera kami informasikan.`
                      );
                      await postNextProject(
                        "ruko",
                        "",
                        userStatus[userId].phone_number
                      );
                      await client.sendMessage(
                        "6288996825018@s.whatsapp.net",
                        `Ada akifitas user dengan nomor ${userStatus[userId].phone_number}. Mohon cek dashboard *Usulan Proyek*`
                      );
                      await resetUserStatus(userId, false);
                      userStatus[userId].nextExcitedAnswer = false;

                      userStatus[userId].isLocationSelected = true;
                      userStatus[userId].isFloorSelected = true;
                      userStatus[userId].isHouseTypeSelected = true;
                      userStatus[userId].isSchemaSelected = true;
                      userStatus[userId].isMinat = true;
                    } else if (
                      userStatus[userId].messageBody.toLowerCase() == "2"
                    ) {
                      await client.sendMessage(
                        userId,
                        `Terimakasih telah menghubungi kami.\nNext kalau misal kami ada penawaran menarik akan segera kami informasikan.`
                      );
                      await postNextProject(
                        "tanah",
                        "",
                        userStatus[userId].phone_number
                      );
                      await client.sendMessage(
                        "6288996825018@s.whatsapp.net",
                        `Ada akifitas user dengan nomor ${userStatus[userId].phone_number}. Mohon cek dashboard *Usulan Proyek*`
                      );
                      await resetUserStatus(userId, false);
                      userStatus[userId].nextExcitedAnswer = false;

                      userStatus[userId].isLocationSelected = true;
                      userStatus[userId].isFloorSelected = true;
                      userStatus[userId].isHouseTypeSelected = true;
                      userStatus[userId].isSchemaSelected = true;
                      userStatus[userId].isMinat = true;
                    } else {
                      if (
                        userStatus[userId].messageBody.toLowerCase() == "99"
                      ) {
                        await resetUserStatus(userId, true);
                        userStatus[userId].isLocationSelected = true;
                      } else {
                        await client.sendMessage(
                          userId,
                          `Maaf pilihan tidak tersedia. Silahkan pilih layanan kami lainya ? \n\n1. Ruko\n2. Tanah\n3. Tidak minat kedua produk diatas\n99. Kembali ke Menu Awal `
                        );
                        userStatus[userId].nextExcitedAnswer = true;
                      }
                    }
                  }
                } else {
                  if (userStatus[userId].nextExcitedWant) {
                    await client.sendMessage(
                      userId,
                      `Terimakasih telah menghubungi kami.\nNext kalau misal kami ada penawaran menarik akan segera kami informasikan.`
                    );

                    await postNextProject(
                      "minat_lain",
                      userStatus[userId].messageBody,
                      userStatus[userId].phone_number
                    );
                    await client.sendMessage(
                      "6288996825018@s.whatsapp.net",
                      `Ada akifitas user dengan nomor ${userStatus[userId].phone_number}. Mohon cek dashboard *Usulan Proyek*`
                    );

                    userStatus[userId].nextExcitedWant = false;
                    await resetUserStatus(userId, false);
                    userStatus[userId].isLocationSelected = true; // true karena menghindari userStatus[userId].isLocationSelected
                    userStatus[userId].isLocationSelected = true;
                    userStatus[userId].isFloorSelected = true;
                    userStatus[userId].isHouseTypeSelected = true;
                    userStatus[userId].isSchemaSelected = true;
                    userStatus[userId].isMinat = true;
                  }
                }
              }

              if (!userStatus[userId].isLocationSelected) {
                if (!userStatus[userId].isFilled) {
                  if (
                    userStatus[userId].locationSession.choice.includes(
                      userStatus[userId].messageBody
                    )
                  ) {
                    userStatus[userId].floorSession = await getFloors(
                      userStatus[userId].locationSession.ids[
                        parseInt(userStatus[userId].messageBody - 1)
                      ]
                    );
                    userStatus[userId].locationName = await getLocationById(
                      userStatus[userId].locationSession.ids[
                        parseInt(userStatus[userId].messageBody - 1)
                      ]
                    );
                    await client.sendMessage(
                      userId,
                      `Di ${
                        userStatus[userId].locationName.location_name
                      }, kami punya tipe tipe lantai yang bisa dipilih. \n\nKetik: \n${
                        userStatus[userId].floorSession.data
                      }${choiceToTop()}`
                    );
                    //   di skip karena sudah benar
                    userStatus[userId].isLocationSelected = true;
                    userStatus[userId].isFloorSelected = false;
                  } else {
                    if (userStatus[userId].messageBody == numberOfTopMenu) {
                      await resetUserStatus(userId, true);
                    } else {
                      await client.sendMessage(
                        userId,
                        `Maaf nomor pilihan tidak tersedia. Mohon pilih sesuai nomor yang tersedia. \n\nKetik: \n${
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

              if (!userStatus[userId].isFloorSelected) {
                if (!userStatus[userId].isFloorFilled) {
                  if (
                    userStatus[userId].floorSession.choice.includes(
                      userStatus[userId].messageBody
                    )
                  ) {
                    userStatus[userId].floorIDSelected =
                      userStatus[userId].floorSession.ids[
                        parseInt(userStatus[userId].messageBody - 1)
                      ];
                    userStatus[userId].houseTypeSession = await getHouseTypes(
                      userStatus[userId].floorIDSelected
                    );

                    await client.sendMessage(
                      userId,
                      `Kami punya tipe tipe rumah yang cocok, sesuai dengan lantai pilihanmu.\nTertarik yang mana nih? ☺️.\n`
                    );
                    for (
                      let i = 0;
                      i < userStatus[userId].houseTypeSession.data.length;
                      i++
                    ) {
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
                            userStatus[userId].houseTypeSession.data[i]
                              .house_types.image[j],
                            { unsafeMime: true }
                          )
                        );
                      }
                    }
                    await client.sendMessage(
                      userId,
                      `Jadi kamu tertarik dengan yang mana nih ?\n\n${
                        userStatus[userId].houseTypeSession.text
                      }${choiceToTop()}`
                    );
                    userStatus[userId].isFloorSelected = true;
                  } else {
                    // salah
                    if (userStatus[userId].messageBody == numberOfTopMenu) {
                      await resetUserStatus(userId, true);
                    } else {
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
                  userStatus[userId].isFloorFilled = false;
                }
                userStatus[userId].isHouseTypeFilled = true;
              }

              if (!userStatus[userId].isHouseTypeSelected) {
                if (!userStatus[userId].isHouseTypeFilled) {
                  if (
                    userStatus[userId].houseTypeSession.choice.includes(
                      userStatus[userId].messageBody
                    )
                  ) {
                    userStatus[userId].houseTypeIDSelected =
                      userStatus[userId].houseTypeIDSelected !== undefined
                        ? userStatus[userId].houseTypeIDSelected
                        : userStatus[userId].houseTypeSession.ids[
                            parseInt(userStatus[userId].messageBody - 1)
                          ];

                    userStatus[userId].houseDetail =
                      await getSchemasAndDescriptions(
                        userStatus[userId].houseTypeIDSelected
                      );

                    await client.sendMessage(
                      userId,
                      userStatus[userId].houseDetail.descriptions
                    );

                    await client.sendMessage(
                      userId,
                      `Di Ahsana ada 3 skema yang bisa kamu pilih.Mana yang cocok dengan rencana keuangan kamu?\n\n1. Cash Keras\n2. Cash Tempo\n3. Kredit\n${choiceToTop()}`
                    );

                    userStatus[userId].isHouseTypeSelected = true;
                    userStatus[userId].isSchemaSelected = false;
                  } else {
                    if (userStatus[userId].messageBody == numberOfTopMenu) {
                      await resetUserStatus(userId, true);
                    } else {
                      await client.sendMessage(
                        userId,
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

              if (!userStatus[userId].isSchemaSelected) {
                if (!userStatus[userId].isSchemaFilled) {
                  if (
                    ["1", "2", "3"].includes(userStatus[userId].messageBody)
                  ) {
                    userStatus[userId].schemaSession =
                      await getSchemasAndDescriptions(
                        userStatus[userId].houseTypeIDSelected
                      );

                    if (userStatus[userId].messageBody == "1") {
                      userStatus[userId].selectedPayment = userStatus[
                        userId
                      ].schemaSession.house_floor_type_payments.find(
                        (payment) => payment.payment_type == "cash"
                      );
                      userStatus[userId].payment_type = "cash";
                      await client.sendMessage(
                        userId,
                        userStatus[userId].selectedPayment.descriptions
                      );
                      userStatus[userId].isSchemaSelected = true;
                      userStatus[userId].isMinat = true;
                    } else if (userStatus[userId].messageBody == "3") {
                      userStatus[userId].selectedPayment = userStatus[
                        userId
                      ].schemaSession.house_floor_type_payments.find(
                        (payment) => payment.payment_type == "credit"
                      );
                      userStatus[userId].payment_type = "credit";
                      await client.sendMessage(
                        userId,
                        userStatus[userId].selectedPayment.descriptions
                      );
                      userStatus[userId].isSchemaSelected = true;
                      userStatus[userId].isMinat = true;
                    } else if (userStatus[userId].messageBody == "2") {
                      userStatus[userId].selectedPayment = userStatus[
                        userId
                      ].schemaSession.house_floor_type_payments.find(
                        (payment) => payment.payment_type == "tempo"
                      );
                      userStatus[userId].payment_type = "tempo";
                      await client.sendMessage(
                        userId,
                        userStatus[userId].selectedPayment.descriptions
                      );
                      userStatus[userId].isSchemaSelected = true;
                      userStatus[userId].isMinat = true;
                    }

                    await client.sendMessage(
                      userId,
                      `Apakah kamu berminat ? \n\n1. Minat\n2. Kurang Minat${choiceToTop()} `
                    );

                    userStatus[userId].isMinat = false;
                    userStatus[userId].isMinatFilled = true;
                  } else {
                    if (userStatus[userId].messageBody == numberOfTopMenu) {
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

              if (!userStatus[userId].isMinat) {
                if (!userStatus[userId].isMinatFilled) {
                  if (userStatus[userId].messageBody.toLowerCase() == "1") {
                    // lanjut iya
                    await client.sendMessage(
                      userId,
                      `Terima kasih untuk informasi yang sudah disampaikan ya!\nTim CS kami akan segera menghubungi Bapak/Ibu untuk penjelasan dan diskusi lebih lanjutnya.\nNamun sebelum itu, MinHouse ingin tahu nih, seberapa urgen Bapak/Ibu mencari rumah?
                              \n\n*1. Rencana beli dalam waktu dekat*.\n\n*2. Masih tanya-tanya dulu min*\n\n*3. Ingin mengecek lokasinya dulu*`
                    );
                    userStatus[userId].isMinat = true;
                    userStatus[userId].isMinatTrue = false;
                    userStatus[userId].isMinatTrueFilled = true;
                    userStatus[userId].isMinatFalse = true;
                    userStatus[userId].isMitraLocationSelected = true;
                    userStatus[userId].isHaveProblem = true;
                    userStatus[userId].isMinatFalseFilled = true;
                  } else if (
                    userStatus[userId].messageBody.toLowerCase() == "2"
                  ) {
                    // lanjut tidak
                    await client.sendMessage(
                      userId,
                      `Yaah..kalau boleh tahu, alasan apa yang membuat Bapak/Ibu tidak tertarik dengan produk Ahsana?\nMasukan dari Bapak/Ibu ini akan kami gunakan untuk memperbaiki pelayanan dan produk kami kedepannya.\n\n*1. Harga / Skema*\n*2. Tipe*\n*3. Lokasi*\n4. Lainya\n${choiceToTop()}`
                    );
                    userStatus[userId].isMinat = true;
                    userStatus[userId].isMinatTrue = true;
                    userStatus[userId].isMinatTrueFilled = true;
                    userStatus[userId].isMinatFalse = false;
                    userStatus[userId].isMinatFalseFilled = true;
                  } else if (
                    userStatus[userId].messageBody == numberOfTopMenu
                  ) {
                    await resetUserStatus(userId, true);
                  } else {
                    await client.sendMessage(
                      userId,
                      `Maaf pilihan tidak tersedia. Pilihan yang tersedia : \n\n1. Minat\n2. Kurang Minat${choiceToTop()}`
                    );
                    userStatus[userId].isMinat = false;
                    userStatus[userId].isMinatTrue = true;
                    userStatus[userId].isMinatFalse = true;
                    userStatus[userId].isMitraLocationSelected = true;
                    userStatus[userId].isHaveProblem = true;
                  }
                } else {
                  userStatus[userId].isMinatFilled = false;
                }
              }

              if (!userStatus[userId].isMinatTrue) {
                if (!userStatus[userId].isMinatTrueFilled) {
                  if (
                    ["1", "2", "3"].includes(userStatus[userId].messageBody)
                  ) {
                    if (userStatus[userId].messageBody.toLowerCase() == "1") {
                      await postUrgentProject(
                        userStatus[userId].houseTypeIDSelected,
                        "hot",
                        userStatus[userId].payment_type,
                        "Rencana beli dalam waktu dekat",
                        userStatus[userId].phone_number
                      );
                      await client.sendMessage(
                        userId,
                        `Terima kasih sudah menyampaikan kebutuhan rumah Bapak/Ibu kepada MinHouse.\nDalam waktu dekat akan ada tim Ahsana Tuban yang akan menghubungi Bapak/Ibu untuk melanjutkan diskusi dan penawaran yang lebih detail.\nTerima kasih!`
                      );
                      userStatus[userId].isMinatTrue = true;
                    } else if (
                      userStatus[userId].messageBody.toLowerCase() == "2"
                    ) {
                      await postUrgentProject(
                        userStatus[userId].houseTypeIDSelected,
                        "warm",
                        userStatus[userId].payment_type,
                        "Masih tanya-tanya dulu",
                        userStatus[userId].phone_number
                      );
                      await client.sendMessage(
                        userId,
                        `Terima kasih sudah menyampaikan kebutuhan rumah Bapak/Ibu kepada MinHouse.\nDalam waktu dekat akan ada tim Ahsana Tuban yang akan menghubungi Bapak/Ibu untuk melanjutkan diskusi dan penawaran yang lebih detail.\nTerima kasih!`
                      );
                      userStatus[userId].isMinatTrue = true;
                      userStatus[userId].isMinatTrue = false;
                      userStatus[userId].isMinatFalse = true;
                      userStatus[userId].isMitraLocationSelected = true;
                      userStatus[userId].isHaveProblem = true;
                    } else if (
                      userStatus[userId].messageBody.toLowerCase() == "3"
                    ) {
                      await postUrgentProject(
                        userStatus[userId].houseTypeIDSelected,
                        "hot",
                        userStatus[userId].payment_type,
                        "Ingin langsung survei lokasi",
                        userStatus[userId].phone_number
                      );
                      await client.sendMessage(
                        userId,
                        `Terima kasih sudah menyampaikan kebutuhan rumah Bapak/Ibu kepada MinHouse.\nDalam waktu dekat akan ada tim Ahsana Tuban yang akan menghubungi Bapak/Ibu untuk melanjutkan diskusi dan penawaran yang lebih detail.\nTerima kasih!`
                      );
                      userStatus[userId].isMinatTrue = true;
                      userStatus[userId].isMinatTrue = false;
                      userStatus[userId].isMinatFalse = true;
                      userStatus[userId].isMitraLocationSelected = true;
                      userStatus[userId].isHaveProblem = true;
                    }

                    await client.sendMessage(
                      "6288996825018@s.whatsapp.net",
                      `Ada akifitas user dengan nomor ${userStatus[userId].phone_number}. Mohon cek dashboard *Daftar Peminat*`
                    );
                    await resetUserStatus(userId, false);
                  } else {
                    // salah
                    await client.sendMessage(
                      userId,
                      "Maaf pilihan tidak tersedia. Silahkan pilih nomor yang sesuai"
                    );
                    userStatus[userId].isMinatTrue = false;
                    userStatus[userId].isMinatFalse = true;
                    userStatus[userId].isMitraLocationSelected = true;
                    userStatus[userId].isHaveProblem = true;
                  }
                } else {
                  userStatus[userId].isMinatTrueFilled = false;
                }
              }

              if (!userStatus[userId].isMinatFalse) {
                if (!userStatus[userId].isMinatFalseFilled) {
                  if (
                    ["1", "2", "3", "4"].includes(
                      userStatus[userId].messageBody
                    )
                  ) {
                    if (userStatus[userId].messageBody == "2") {
                      await client.sendMessage(
                        userId,
                        `Baik jika alasan kamu adalah *Tipe Rumah*. Saya sarankan untuk memilih tipe rumah kembali.`
                      );
                      await resetUserStatus(userId, false);
                    } else if (userStatus[userId].messageBody == "3") {
                      await client.sendMessage(
                        userId,
                        `Mohon isikan lokasi yang kamu inginkan.`
                      );
                      userStatus[userId].isMitraLocationSelected = false;
                      userStatus[userId].isMinatFalse = true;
                    } else if (userStatus[userId].messageBody == "1") {
                      userStatus[userId].isMinatFalse = true;
                      userStatus[userId].isMinatFalseFilled = true;
                      userStatus[userId].isMinat = true;
                      userStatus[userId].isHouseTypeSelected = true;
                      userStatus[userId].isHouseTypeFilled = true;
                      userStatus[userId].isSchemaSelected = false;

                      await client.sendMessage(
                        userId,
                        `Di Ahsana ada 3 skema yang bisa kamu pilih.Mana yang cocok dengan rencana keuangan kamu?\n\n1. Cash Keras\n2. Cash Tempo\n3. Kredit${choiceToTop()}`
                      );
                    } else if (userStatus[userId].messageBody == "4") {
                      await client.sendMessage(
                        userId,
                        `Problem apa yang kamu alami ?`
                      );
                      userStatus[userId].isHaveProblem = false;
                      userStatus[userId].isMinatFalse = true;
                    }
                  } else {
                    if (userStatus[userId].messageBody == numberOfTopMenu) {
                      await resetUserStatus(userId, true);
                    } else {
                      await client.sendMessage(
                        userId,
                        "Maaf pilihan tidak tersedia. Silahkan pilih sesuai nomor"
                      );
                      userStatus[userId].isMinatFalse = false;
                    }
                  }
                } else {
                  userStatus[userId].isMinatFalseFilled = false;
                }
                userStatus[userId].isMitraLocationSelectedFilled = true;
                userStatus[userId].isHaveProblemFilled = true;
              }
              if (!userStatus[userId].isMitraLocationSelected) {
                if (!userStatus[userId].isMitraLocationSelectedFilled) {
                  userStatus[userId].isMitraLocationSelected = true;
                  await postNextProject(
                    "lokasi_request",
                    userStatus[userId].messageBody,
                    userStatus[userId].phone_number
                  );
                  await client.sendMessage(
                    userId,
                    `Terimakasih telah menghubungi kami.\nNext kalau misal kami ada penawaran menarik akan segera kami informasikan`
                  );
                  await client.sendMessage(
                    "6288996825018@s.whatsapp.net",
                    `Ada akifitas user dengan nomor ${userStatus[userId].phone_number}. Mohon cek dashboard *Usulan Proyek*`
                  );
                  await resetUserStatus(userId, false);
                } else {
                  userStatus[userId].isMitraLocationSelectedFilled = false;
                }
              }
              if (!userStatus[userId].isHaveProblem) {
                if (!userStatus[userId].isHaveProblemFilled) {
                  userStatus[userId].isHaveProblem = true;
                  await postNextProject(
                    "problem_lain",
                    userStatus[userId].messageBody,
                    userStatus[userId].phone_number
                  );
                  await client.sendMessage(
                    userId,
                    `Terimakasih telah menghubungi kami.\nNext kalau misal kami ada penawaran menarik akan segera kami informasikan`
                  );
                  await client.sendMessage(
                    "6288996825018@s.whatsapp.net",
                    `Ada akifitas user dengan nomor ${userStatus[userId].phone_number}. Mohon cek dashboard *Usulan Proyek*`
                  );
                  await resetUserStatus(userId, false);
                } else {
                  userStatus[userId].isHaveProblemFilled = false;
                }
              }
            }
          }
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
