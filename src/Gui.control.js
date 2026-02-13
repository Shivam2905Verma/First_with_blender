import GUI from "lil-gui";

export function setupGUI(sunLight, helper, shadowHelper, camera) {
  const gui = new GUI();

  const sunFolder = gui.addFolder("Sun Position");

  sunFolder.add(sunLight.position, "x", 0, 500).name("Sun X");
  sunFolder.add(sunLight.position, "y", 0, 500).name("Sun Y");
  sunFolder.add(sunLight.position, "z", -100, 500).name("Sun Z");

  const cameraFolder = gui.addFolder("Camera Position");
  cameraFolder.add(camera, "x", -1000, 100).name("camera X");
  cameraFolder.add(camera, "y", 0, 800).name("camera Y");
  cameraFolder.add(camera, "z", -1000, 100).name("camera Z");

  sunFolder.onChange(() => {
    if (helper) helper.update();
    if (shadowHelper) shadowHelper.update();
  });

  cameraFolder.onChange(() => {
    // if (camera) camera.update();
  });

  const shadowFolder = gui.addFolder("Shadow Camera");
  shadowFolder.add(sunLight.shadow.camera, "top", 10, 500);
  shadowFolder.add(sunLight.shadow.camera, "bottom", -500, -10);
  shadowFolder.add(sunLight.shadow.camera, "left", -500, -10);
  shadowFolder.add(sunLight.shadow.camera, "right", 0, 500);


  shadowFolder.onChange(() => {
    sunLight.shadow.camera.updateProjectionMatrix();
    if (shadowHelper) shadowHelper.update();
  });

  return gui;
}
