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

  function welcomeMessage() {
    return `Halo! 👋 Kami dari Ahsana Tuban ingin mengenal Anda. Apakah Anda saat ini sedang mencari rumah ?\n\nBalas *Ya* jika Anda sedang mencari rumah.\n\nBalas *Tidak* jika Anda tidak sedang mencari rumah.\n\nTerima kasih! 🏠.
    `;
  }

  let isStart = true;
  let locationSelected = false;
  let floorSelected = false;
  let typeSelected = false;
  let isReallyExcited = false;
  let isAlmostFinish = false;
  let isFinish = false;

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
        if (message.body == "Ya" || message.body == "ya") {
          const location = await getLocations();
          if (!locationSelected) {
            await client.sendMessage(
              message.from,
              `Terimakasih atas jawabanya. Kebetulan sekali kami memiliki beberapa titik lokasi perumahan yang tersedia :\n\n${location.data}\n\nApabila Anda tertarik dengan salah satu lokasi di atas, harap beri tahu kami nomor pilihan Anda.\n\nTerima kasih! 🏡
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
                  `Terimakasih telah memilih titik lokasi. Berikut adalah lantai yang tersedia di titik lokasi:\n\n${floors.data}\n\nJika Anda tertarik dengan salah satu lantai di atas, harap beri tahu kami nomor pilihan yang menjadi pilihan Anda\n\nTerimakasih!🏡`
                );
                floorSession = floors;
                floorIDSelected = floors.ids[parseInt(message.body - 1)];
                floorSelected = true;
              } else {
                await client.sendMessage(
                  message.from,
                  `Maaf nomor pilihan tidak tersedia. Mohon pilih sesuai nomor yang tersedia.\nBerikut adalah daftar lantai yang tersedia:\n${location.data}`
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
                    `Terimakasih telah memilih lantai. Berikut adalah *tipe rumah beserta gambar* yang tersedia saat ini:\n\n`
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
                    `Silakan masukkan nomor pilihan Anda berdasarkan tipe rumah yang Anda inginkan. :\n${house_type.text}\n\nTerimakasih!🏡`
                  );
                  typeSelected = true;
                } else {
                  let floor_repeat = floorSession;
                  await client.sendMessage(
                    message.from,
                    `Maaf nomor pilihan tidak tersedia. Mohon pilih sesuai nomor yang tersedia.\nBerikut adalah daftar lantai yang tersedia:\n${floor_repeat.data}`
                  );
                }
              } else {
                if (!isReallyExcited) {
                  if (houseTypeSession.choice.includes(message.body)) {
                    let schemas_and_descriptions =
                      await getSchemasAndDescriptions(houseTypeIDSelected);
                    await client.sendMessage(
                      message.from,
                      `Terimakasih atas pilihan tipe rumah anda sebelumnya. Berikut deskripsi tentang tipe rumah yang anda pilih: \n\n ${schemas_and_descriptions.descriptions}`
                    );
                    await client.sendMessage(
                      message.from,
                      `Kami ingin menjelaskan tentang skema yang kami tawarkan, yaitu "Tanpa Bank, Tanpa Sita, Tanpa Denda, dan Tanpa Bunga." Skema ini dirancang untuk memberikan solusi finansial yang mudah, tanpa melibatkan bank, risiko sita, denda, atau biaya bunga.\n✅ Tanpa Bank: Tidak ada keterlibatan bank. Jadi, Anda tidak perlu repot mengurus pinjaman atau membayar bunga kepada pihak bank. Kami ingin memberikan pengalaman yang sederhana dan cepat tanpa melibatkan prosedur bank yang rumit.\n❌ Tanpa Sita: Kami tidak akan melakukan penyitaan aset. Jadi, Anda tidak perlu khawatir kehilangan atau pengambilalihan aset Anda. Kami ingin memastikan bahwa Anda tetap memiliki kendali penuh atas aset Anda tanpa risiko sita.\n🚫 Tanpa Denda: Tidak ada risiko denda dalam skema kami. Kami mengerti bahwa dalam situasi keuangan sulit, denda hanya akan membebani Anda lebih lanjut. Kami ingin memberikan solusi yang membantu mengurangi beban finansial Anda tanpa menambahkan masalah baru.\n💰 Tanpa Bunga: Keunggulan utama skema kami adalah tidak ada biaya bunga yang dikenakan. Artinya, Anda tidak perlu membayar biaya tambahan berdasarkan tingkat suku bunga seperti dalam pinjaman tradisional. Kami ingin memberikan solusi finansial yang terjangkau dan adil tanpa beban bunga yang berlebihan.\nDengan skema "Tanpa Bank, Tanpa Sita, Tanpa Denda, dan Tanpa Bunga" kami, kami bertujuan untuk memberikan solusi finansial yang mudah dimengerti, cepat, dan adil. Kami siap membantu Anda melewati situasi keuangan sulit dengan pilihan yang sesuai dengan kebutuhan dan preferensi Anda.`
                    );

                    await client.sendMessage(
                      message.from,
                      `Nah untuk tipe rumah yang anda pilih diatas tadi mempunyai jenis pembayaran : \n`
                    );
                    let payment_desc = "";
                    schemas_and_descriptions.house_floor_type_payments.forEach(
                      (element, index) => {
                        payment_desc += `*${element.payment_type.toUpperCase()}*\n${
                          element.descriptions
                        }\n\n`;
                      }
                    );
                    await client.sendMessage(message.from, payment_desc);
                    await client.sendMessage(
                      message.from,
                      `Apakah anda berminat ? \n\nSilahkan balas *Minat* jika anda berminat, atau balas *Tidak* jika anda tidak berminat`
                    );
                    isReallyExcited = true;
                  } else {
                    let house_type_repeat = await getHouseTypes(
                      floorIDSelected
                    );
                    await client.sendMessage(
                      message.from,
                      `Maaf nomor pilihan tidak tersedia. Mohon pilih sesuai nomor yang tersedia.\nBerikut adalah daftar tipe rumah yang tersedia:\n${house_type_repeat.text}`
                    );
                  }
                } else {
                  if (!isAlmostFinish) {
                    if (
                      message.body.toLocaleLowerCase() == "minat" ||
                      message.body.toLocaleLowerCase() == "tidak"
                    ) {
                      if (!isFinish) {
                        if (message.body.toLocaleLowerCase() == "minat") {
                          await client.sendMessage(
                            message.from,
                            `Terima kasih telah memilih perumahan, lantai, dan tipe rumah yang Anda inginkan. Berdasarkan pilihan tersebut, kami ingin mengetahui lebih lanjut mengenai rencana Anda. Mohon pilih salah satu opsi berikut:\n\n\n*1.Rencana beli dalam waktu dekat*: Jika Anda berencana untuk segera membeli rumah tersebut, kami akan menghubungi Anda untuk memberikan informasi lebih lanjut dan membantu proses pembelian.\n\n*2. Masih tanya-tanya dulu*: Jika Anda masih memiliki pertanyaan atau ingin meminta informasi tambahan sebelum membuat keputusan, kami siap membantu Anda. Silakan beri tahu kami pertanyaan atau kebutuhan informasi tambahan Anda.\n\n*3. Ingin langsung survei lokasi*: Jika Anda ingin segera melihat langsung lokasi perumahan dan mendapatkan informasi lebih detail, kami dapat mengatur jadwal survei untuk Anda. Silakan beri tahu kami kapan waktu yang cocok bagi Anda.\n\n\nMohon pilih nomor opsi yang sesuai dengan rencana Anda atau berikan informasi lebih lanjut mengenai kebutuhan Anda. Terima kasih!`
                          );
                          isFinish = true;
                          isAlmostFinish = true;
                        }
                      }
                    } else {
                      await client.sendMessage(
                        message.from,
                        `Maaf nomor pilihan tidak tersedia. Silahkan balas *Minat* jika anda berminat, atau balas *Tidak* jika anda tidak berminat`
                      );
                    }
                  } else {
                    await client.sendMessage(
                      message.from,
                      `Terima kasih atas respons Anda! Untuk melanjutkan proses dan memberikan informasi lebih lanjut sesuai dengan rencana Anda, kami sarankan Anda menghubungi Layanan Pelanggan kami. Silakan hubungi kami melalui Whatsapp kami https://wa.me/088996825018 \n\nTim Layanan Pelanggan kami siap membantu Anda dengan segala pertanyaan, informasi tambahan, atau memandu Anda melalui proses pembelian. Jangan ragu untuk menghubungi kami sesuai kenyamanan Anda.\n\nTerima kasih atas minat Anda pada perumahan kami! Kami berharap dapat membantu Anda dalam mencapai impian memiliki rumah yang ideal.`
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
          await client.sendMessage(
            message.from,
            `Maaf pilihan tidak tersedia. \n\nBalas *Ya* jika Anda sedang mencari rumah.\n\nBalas *Tidak* jika Anda tidak sedang mencari rumah.\n\nTerima kasih! 🏠.`
          );
        }
      }
    }
  });
});

client.initialize();
