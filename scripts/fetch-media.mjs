import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BASE = "https://cdn.myportfolio.com/1fff6c86-082b-4cb6-a93c-51b153f3ec2c/";
const OUT = path.resolve("public/media");

const files = [
  ["sjwd/welcome.jpg", "d5c2a3d0-2bcf-49a1-863f-e2bbb9db99ff_rw_1920.jpg?h=51dee391d5459004b67cfd53e5db39bf"],
  ["sjwd/tote.jpg", "5e9a1ee0-aa89-4e3e-93d9-2987897a57e1_rw_1200.jpg?h=746f137787c5779510f641436b196fbc"],
  ["sjwd/mug.jpg", "adc7ae2a-0a1b-4383-b035-acd4af80414a_rw_1920.jpg?h=6bc2c5b9321b8ad7b84b8207665bc14d"],
  ["sjwd/pass.jpg", "edca0a59-d01e-4f22-9ff6-008dadcfa744_rw_1920.jpg?h=b134797e39198d9d2a69578cbb44aa3e"],
  ["sjwd/alerts.jpg", "469f2a8d-0803-4e4d-82ba-d137321d9d06_rw_1200.jpg?h=11dacbedf8ba1caf7e0bcdaa50d84640"],
  ["sjwd/drops.jpg", "c10bb63b-e95f-410a-92f7-0527a1b8f5f2_rw_1200.jpg?h=403a9ee86bf7847ee96fd92705958d4b"],
  ["sjwd/seventy.jpg", "b5dd059b-5124-49c0-8c87-349e7f20d44b_rw_1200.jpg?h=3c2111e88045621ddd9764d5487f32bf"],
  ["sjwd/seal.jpg", "727bf4f4-e749-4c02-bac6-63155f7c7c2b_rw_1200.jpg?h=2f54e68f257ab94fe8ab4f91885c4fd0"],
  ["sjwd/map.jpg", "90ff4d42-782f-4fbb-b2a4-446df6788f89_rw_1920.jpg?h=97756df3848710d7dbe5b6eb88e3407b"],
  ["sjwd/wildlife.jpg", "e8e1e886-c05e-486c-81af-8bc81c5b5c54_rw_1920.jpg?h=d8cdd464fa198bcdc22523245c72ec4d"],
  ["sjwd/meter.jpg", "d85b49cd-3936-4321-a6da-d21bcd82f38b_rw_1920.jpg?h=13a7abab60785a17f042bb0261cef3fd"],
  ["sjwd/system.png", "b4b4fc65-e650-435f-abdc-2fcbb1963fd1_car_202x158.png?h=07cc30bcf807e3e1d6ed7cc76a36d5b7"],

  ["imagine/01.jpg", "ce6aa247-e288-4e89-abe1-da15ea555fcc_rw_3840.jpg?h=1603ab7d5c1cf3f0007a3280b8747d4c"],
  ["imagine/02.png", "80022934-8bee-4f2c-91fa-15910d5332f4_rw_1920.png?h=91df0fe93eda25642aa4498c977afdd0"],
  ["imagine/03.png", "4cd4d2ca-7d01-4c19-b2dc-2d74bf061ea3_rw_1920.png?h=a2450f97c781deac42c327562003094c"],
  ["imagine/04.png", "d747a560-e787-4c43-a938-9827ed9e333a_rw_1920.png?h=8bc449918201d10d07c77e2f00dde03d"],
  ["imagine/05.jpg", "94c1540f-1160-4082-8b10-33603138bb55_rw_1920.jpg?h=a41f2561f9f209c6a884369af8466481"],
  ["imagine/06.jpg", "1ed8fb73-73ec-443b-b520-68d46f327266_rw_3840.jpg?h=e4a076a4774501e30a779a7d7f83ad50"],
  ["imagine/07.jpg", "a3eef932-1495-4857-882a-018848310b28_rw_3840.jpg?h=8cc079a15f5067f37b4acfa08ce778b1"],
  ["imagine/08.jpg", "c56befd2-ffbd-4c93-8159-47b3d28a668f_rw_3840.jpg?h=ba2fb58b4bcfedf97caec09094d7986d"],
  ["imagine/09.jpg", "01ce0f8b-7fc3-418a-8453-9d3cc580e654_rw_1920.jpg?h=4255dea51dcf5137b42c4cba648ecc27"],
  ["imagine/10.jpg", "93bc9ff5-b808-4472-960b-a82df9beb754_rw_3840.jpg?h=84c223465ee09edc0ef8fb97cb733704"],
  ["imagine/11.jpg", "7a407b17-4597-4c9d-be93-d94507b03fd1_rw_1920.jpg?h=6393ae27adc70b64ab6159f1a7377b2e"],
  ["imagine/12.png", "c2997257-67e0-4243-b68b-98039d2d8010_rw_1920.png?h=5eca1d080724212d0fbbdaab0505fce0"],
  ["imagine/13.jpg", "1c27255d-61fc-4fa0-9730-f54544d7473f_rw_3840.jpg?h=4e71d6176a987fed45ee6e081e302bda"],
  ["imagine/14.jpg", "271614f1-ac6b-42b3-88a0-ca9525679d05_rw_1920.jpg?h=cc8addd86bbd740bbad4f5d4bf275553"],

  ["frog/miro.png", "4360abc0-f840-4140-b54a-b6c77a82a501_rw_1920.png?h=5668cd3a640283c491e8ebaa6bab96ca"],
  ["frog/turnaround.jpg", "3ef0a3dc-76c1-4dc8-b6de-f15231d1fbaf_rw_1920.jpg?h=9188a5c82ac09e4a746eed8bf8aa13e9"],
  ["frog/concepts.jpg", "4dcb97be-59f7-4e15-b8a6-cba9427c6ed2_rw_1200.jpg?h=29e07c6c18c0500a1bb71c6ad86da88e"],
  ["frog/logo.jpg", "76fdf61e-8666-467d-ba52-eda496331e50_rw_1920.jpg?h=53b1c2e9feeac4bd8cd03f9f0299ab39"],
  ["frog/prototype.jpg", "f070632b-b192-4ab4-b639-b5404aee6454_rw_1200.jpg?h=fba263e2e584bc4fd691bdbbc616809e"],
  ["frog/machine.png", "bed8021d-51a4-4e0a-a1f1-4826b38d5674_rwc_246x31x774x605x774.png?h=4024091ca7e479b24f5d0086cc11106f"],

  ["plush/juno.jpg", "e2befd46-d0ba-4075-a7ec-59478a19f69e_rw_1920.jpg?h=08050f02993b4bf183cae3a5a590bc29"],
  ["plush/jamie.jpg", "1be04931-db9e-4059-80f1-d270f95d722b_rw_1920.jpg?h=880d61ca78b14403ff94c415c318a10d"],
  ["plush/draft.png", "d889f102-9545-481d-b7c2-b0b06bc6c4e2_rw_1200.png?h=42a7d0e3a93e37e4cc507b8be6d21b6e"],
  ["plush/side.png", "e85ee0db-52d7-4889-9915-3a3b131830a0_rw_1200.png?h=54e267fab6a423d28dc302be5d04c1cf"],
  ["plush/feedback.jpg", "cf7abd19-7df7-40a3-ac85-aa63695b3d9b_rw_1920.jpg?h=14a8c09eb630ca4825bc40332b57d645"],
  ["plush/final-a.jpg", "1550baf1-e93f-41e4-8532-7f2a8c8f5f52_rw_600.jpg?h=902f80a362d72fcedd81d55abc8f4feb"],
  ["plush/final-b.jpg", "cc7ce0b6-70f5-4f3f-b7cd-9c46ec6630bd_rw_1920.jpg?h=21c3acb5e87195ec26229474833e79fc"],
  ["plush/pair.jpg", "5abc8a67-b1e2-4d3a-ba4c-d9c53fafa0a8_rwc_0x22x504x394x504.jpg?h=a765d5da1bb260f5458681894d69257f"],

  ["personal/01.jpg", "e907183f-ece2-4d0c-a2b0-5f9a2b3d5235_rw_3840.jpg?h=629858a94715bdfe8f126a8dbd4946bc"],
  ["personal/02.jpg", "a4e34273-fac7-4e14-bad5-445d5be3d195_rw_1920.jpg?h=3cf5e36dee227e05fe8e96b5343ff175"],
  ["personal/03.jpg", "edf7a61d-329e-48b8-a79f-65904c3188cc_rw_1920.jpg?h=d98ba23cf3696a1dcbd53c57243be591"],
  ["personal/04.png", "ddab8dc3-83a7-4de0-aa90-b04a2dfcbefd_rw_1920.png?h=4d7e9886468ea64589ec03f5014fa232"],
  ["personal/05.jpg", "c6cdb370-a0c9-46a0-90be-cbb31e42f4f4_rw_1920.jpg?h=32a65afaf507bc1443f4ad23b2ebf8f7"],
  ["personal/06.jpg", "7d3bbee0-e705-4988-a230-b34865145e71_rw_1920.jpg?h=b7b4dd09116a11afda96a2f1eb5ba871"],
  ["personal/07.jpg", "c073c250-77d3-42da-8d3c-4c7c6a2e83e8_rw_1920.jpg?h=b4a22a396209f0ee4fe82efa5706e9db"],
  ["personal/08.png", "4d97c0b3-c669-4a9c-a8dd-c2231abfc0de_rw_1920.png?h=d6e4c1151a90feef1ac6cf42487c39ac"],
  ["personal/09.jpg", "a05ac3bb-51dd-4a69-a9d9-7afb7e831185_rw_1920.jpg?h=04785270a6d8091e9721daae034b7cb5"],
  ["personal/10.jpg", "78976dd9-34d4-49ad-b4fa-f2f179cd0bf1_rw_1920.jpg?h=780dd551f6f4809d72a155bc430db2ae"],
  ["personal/11.png", "da599737-3ef5-4be8-b5f4-11a2ea4dcf6a_rw_1920.png?h=2d540991568061d99092af5da913db3b"],
  ["personal/12.png", "7c2655cd-2359-4c22-ad24-c008fb02d639_rw_1920.png?h=2f4e5e0deeef507eaf58bac69647722a"],
  ["personal/13.jpg", "5d13c38a-2b3d-422d-b31a-4ffa44c1f675_rw_1920.jpg?h=76441870430230b83b2ea4f74bce8d67"],
  ["personal/14.png", "068cbbc8-7f91-4fbd-bad3-e6daae49ace7_rw_1200.png?h=12533393b8dc6d3f33faaeb212090481"],
];

const thumbs = [
  "sjwd/welcome.jpg",
  "sjwd/map.jpg",
  "sjwd/system.png",
  "imagine/11.jpg",
  "imagine/01.jpg",
  "frog/machine.png",
  "plush/juno.jpg",
  "plush/jamie.jpg",
  "personal/01.jpg",
  "personal/02.jpg",
  "personal/03.jpg",
  "personal/04.png",
  "personal/05.jpg",
  "personal/07.jpg",
  "personal/09.jpg",
];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(rel, urlPath) {
  const dest = path.join(OUT, rel.replace(/\.(png|jpe?g)$/i, ".webp"));
  if (await exists(dest)) {
    console.log("skip", dest);
    return dest;
  }
  const url = BASE + urlPath;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  const img = sharp(buf, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  await img
    .resize({ width: 1800, withoutEnlargement: true })
    .webp({ quality: 76 })
    .toFile(dest);
  console.log("wrote", path.relative(OUT, dest), meta.width, "x", meta.height);
  return dest;
}

await mkdir(path.join(OUT, "thumbs"), { recursive: true });
const written = new Map();
for (const [rel, url] of files) {
  try {
    written.set(rel, await download(rel, url));
  } catch (err) {
    console.error("FAIL", rel, err.message);
  }
}
for (const rel of thumbs) {
  const src = written.get(rel);
  if (!src) continue;
  const name = rel.replace(/\//g, "-").replace(/\.(png|jpe?g)$/i, ".webp");
  const dest = path.join(OUT, "thumbs", name);
  if (await exists(dest)) continue;
  await sharp(src).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 72 }).toFile(dest);
  console.log("thumb", name);
}
console.log("done");
