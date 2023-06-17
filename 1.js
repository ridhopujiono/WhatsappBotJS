const qrcode = require("qrcode-terminal");
const { Client, List, LocalAuth, Buttons } = require("whatsapp-web.js");
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

  client.on("message", async (message) => {
    if (message.body === "Mulai") {
      const productsList = new List(
        "Here's our list of products at 50% off",
        "View all products",
        [
          {
            title: "Products list",
            rows: [
              { id: "apple", title: "Apple" },
              { id: "mango", title: "Mango" },
              { id: "banana", title: "Banana" },
            ],
          },
        ],
        "Please select a product"
      );
      //   console.log(productsList);
      client.sendMessage(message.from, productsList);
    }
  });
});

client.initialize();
