#import "NotificationService.h"

// Standard FCM rich-notification extension: download the image URL FCM puts
// under fcm_options.image (falling back to a plain top-level "image" key,
// since some send paths — e.g. this app's admin broadcast — may set it there
// directly) and attach it before handing the notification back to the OS.
// No Firebase/OneSignal SDK needed — this only ever reads the plain payload
// dictionary and does a normal URL download.

@interface NotificationService ()

@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNNotificationRequest *receivedRequest;
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;

@end

@implementation NotificationService

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
    self.receivedRequest = request;
    self.contentHandler = contentHandler;
    self.bestAttemptContent = [request.content mutableCopy];

    NSDictionary *userInfo = request.content.userInfo;
    NSString *imageUrlString = userInfo[@"fcm_options"][@"image"];
    if (imageUrlString == nil) {
        imageUrlString = userInfo[@"image"];
    }

    if (imageUrlString == nil) {
        self.contentHandler(self.bestAttemptContent);
        return;
    }

    NSURL *imageUrl = [NSURL URLWithString:imageUrlString];
    if (imageUrl == nil) {
        self.contentHandler(self.bestAttemptContent);
        return;
    }

    __weak typeof(self) weakSelf = self;
    [self downloadImageAtUrl:imageUrl completionHandler:^(NSURL * _Nullable localFileUrl) {
        typeof(self) strongSelf = weakSelf;
        if (strongSelf == nil) {
            return;
        }
        if (localFileUrl != nil) {
            NSError *attachmentError = nil;
            UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:@"image"
                                                                                                    URL:localFileUrl
                                                                                                options:nil
                                                                                                  error:&attachmentError];
            if (attachment != nil) {
                strongSelf.bestAttemptContent.attachments = @[attachment];
            }
        }
        strongSelf.contentHandler(strongSelf.bestAttemptContent);
    }];
}

- (void)downloadImageAtUrl:(NSURL *)url completionHandler:(void (^)(NSURL * _Nullable localFileUrl))completionHandler {
    NSURLSessionDownloadTask *task = [[NSURLSession sharedSession]
        downloadTaskWithURL:url
          completionHandler:^(NSURL * _Nullable location, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        if (error != nil || location == nil) {
            completionHandler(nil);
            return;
        }

        NSString *fileExtension = url.pathExtension.length > 0 ? url.pathExtension : @"jpg";
        NSURL *tmpDirectory = [NSURL fileURLWithPath:NSTemporaryDirectory()];
        NSURL *localUrl = [[tmpDirectory URLByAppendingPathComponent:[[NSProcessInfo processInfo] globallyUniqueString]]
                            URLByAppendingPathExtension:fileExtension];

        NSError *moveError = nil;
        [[NSFileManager defaultManager] moveItemAtURL:location toURL:localUrl error:&moveError];
        if (moveError != nil) {
            completionHandler(nil);
            return;
        }

        completionHandler(localUrl);
    }];
    [task resume];
}

// iOS gives the extension a limited time budget to finish; if the image
// download hasn't completed by then, fall back to showing the notification
// without it rather than dropping it entirely.
- (void)serviceExtensionTimeWillExpire {
    self.contentHandler(self.bestAttemptContent);
}

@end
