import { NotificationSetting } from "./NotificationsSetting";

export const SettingsModal = () => {
  return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button
        type="button"
        className="btn"
        onClick={() =>
          (
            document?.getElementById("my_modal_1") as HTMLDialogElement
          ).showModal()
        }
      >
        ⚙️
      </button>
      <dialog id="my_modal_1" className="modal">
        <div className="modal-box text-black">
          <h3 className="pb-2 font-bold text-lg">Settings</h3>

          <h4 className="font-bold">Notifications</h4>
          <NotificationSetting />

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn" type="submit">
                ✖︎
              </button>
            </form>
          </div>
        </div>
      </dialog>

      <style>{
        /* css */ ` 
          #my_modal_1{
            overflow:none
          }
      `
      }</style>
    </>
  );
};
