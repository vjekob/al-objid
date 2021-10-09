export default async (context) => {
    context.res = {
        status: 410,
        body: "Invoke v2/syncIds instead. [STATUS_REASON=APP_UPGRADED_V2]"
    }
}
